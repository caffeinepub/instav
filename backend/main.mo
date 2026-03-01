import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import List "mo:core/List";
import Set "mo:core/Set";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Migration "migration";

(with migration = Migration.run)
actor {
  type Post = {
    id : Nat;
    authorPrincipal : Principal;
    authorName : Text;
    media : ?Storage.ExternalBlob;
    mediaType : Text;
    caption : Text;
    timestamp : Int;
    likeCount : Nat;
    viewCount : Nat;
  };

  type Comment = {
    id : Nat;
    postId : Nat;
    authorPrincipal : Principal;
    authorName : Text;
    text : Text;
    timestamp : Int;
  };

  type PostInput = {
    authorName : Text;
    media : ?Storage.ExternalBlob;
    mediaType : Text;
    caption : Text;
  };

  public type UserProfileData = {
    handle : Text;
    displayName : Text;
    bio : Text;
    profilePicture : ?Storage.ExternalBlob;
  };

  type UserProfile = {
    caller : Principal;
    data : UserProfileData;
  };

  type NotificationType = {
    #new_shadow;
    #message;
    #comment;
  };

  type Notification = {
    id : Nat;
    notificationType : NotificationType;
    fromPrincipal : Principal;
    timestamp : Int;
    read : Bool;
    postId : ?Nat;
  };

  type Conversation = {
    participants : (Principal, Principal);
    lastUpdated : Int;
  };

  type Message = {
    sender : Principal;
    recipient : Principal;
    content : Text;
    timestamp : Int;
    postId : ?Nat;
    read : Bool;
  };

  // Friendship Types
  type FriendRequestStatus = {
    #pending;
    #accepted;
    #declined;
  };

  type FriendRequest = {
    sender : Principal;
    recipient : Principal;
    status : FriendRequestStatus;
    timestamp : Int;
  };

  type FriendshipStatusEnum = {
    #notConnected;
    #pendingOutgoing;
    #pendingIncoming;
    #friends;
  };

  let postsMap = Map.empty<Nat, Post>();
  let commentsMap = Map.empty<Nat, Comment>();
  var postCounter = 0;
  var commentCounter = 0;

  // Store conversations between two users
  let conversations = Map.empty<Principal, Map.Map<Principal, Conversation>>();
  let conversationMessages = Map.empty<Principal, Map.Map<Principal, List.List<Message>>>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  let userProfiles = Map.empty<Principal, UserProfile>();
  let handleToPrincipalMap = Map.empty<Text, Principal>();
  let notifications = Map.empty<Principal, Map.Map<Nat, Notification>>();
  var notificationIdCounter = 0;

  let followingMap = Map.empty<Principal, Set.Set<Principal>>();
  let followersMap = Map.empty<Principal, Set.Set<Principal>>();

  type UserProfileSummary = {
    principal : Principal;
    handle : Text;
    displayName : Text;
    bio : Text;
    avatarUrl : ?Storage.ExternalBlob;
    postCount : Nat;
    followerCount : Nat;
    followingCount : Nat;
  };

  // friendRequests keyed by recipient principal, storing list of requests sent to that recipient
  let friendRequests = Map.empty<Principal, List.List<FriendRequest>>();
  var friendCount = 0;

  // Store last visited profile timestamps per user (visitor -> visited -> timestamp)
  let lastVisitedProfiles = Map.empty<Principal, Map.Map<Principal, Int>>();

  // Stable map for persistent visit history
  let visitHistory = Map.empty<Principal, List.List<Principal>>();

  // Record a profile visit (stores persistent last 2 unique entries)
  public shared ({ caller }) func recordVisit(visited : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can record visits");
    };

    let MAX_HISTORY = 2;

    let currentHistory = switch (visitHistory.get(caller)) {
      case (?history) { history };
      case (null) {
        let newHistory = List.empty<Principal>();
        visitHistory.add(caller, newHistory);
        newHistory;
      };
    };

    // Remove if already exists (ensure uniqueness)
    let filteredHistory = List.empty<Principal>();
    for (entry in currentHistory.values()) {
      if (entry != visited) { filteredHistory.add(entry) };
    };

    // Add new entry at the front
    filteredHistory.add(visited);

    // Keep only the last MAX_HISTORY entries
    let finalHistory = List.empty<Principal>();
    let entriesArray = filteredHistory.toArray();
    let size = Nat.min(entriesArray.size(), MAX_HISTORY);
    var i = 0;
    while (i < size) {
      finalHistory.add(entriesArray[i]);
      i += 1;
    };

    visitHistory.add(caller, finalHistory);
  };

  // Get visit history for the current user
  public query ({ caller }) func getVisitHistory() : async [Principal] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access visit history");
    };
    switch (visitHistory.get(caller)) {
      case (?history) { history.toArray() };
      case (null) { [] };
    };
  };

  // Get dynamic list for right-side profile row (deduplicated, ordered: friends, following, visited)
  public query ({ caller }) func getProfileRowUsers() : async [Principal] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access profile row data");
    };

    let MAX_VISITS = 2;

    // Get mutual follows (friends) and non-mutual following
    let mutualFollows = List.empty<Principal>();
    let nonMutualFollowing = List.empty<Principal>();

    switch (followingMap.get(caller)) {
      case (?callerFollowing) {
        for (user in callerFollowing.values()) {
          let isMutual = switch (followersMap.get(user)) {
            case (?followers) { followers.contains(caller) };
            case (null) { false };
          };
          if (isMutual) {
            mutualFollows.add(user);
          } else {
            nonMutualFollowing.add(user);
          };
        };
      };
      case (null) {};
    };

    // Get last 2 visited unique profiles (not already in mutual or following)
    let visits = List.empty<Principal>();
    switch (visitHistory.get(caller)) {
      case (?history) {
        var count = 0;
        for (visit in history.values()) {
          if (count < MAX_VISITS) {
            var isDuplicate = false;
            for (entry in mutualFollows.values()) {
              if (entry == visit) { isDuplicate := true };
            };
            for (entry in nonMutualFollowing.values()) {
              if (entry == visit) { isDuplicate := true };
            };
            if (not isDuplicate) {
              visits.add(visit);
              count += 1;
            };
          };
        };
      };
      case (null) {};
    };

    let result = List.empty<Principal>();
    for (entry in mutualFollows.values()) { result.add(entry) };
    for (entry in nonMutualFollowing.values()) { result.add(entry) };
    for (entry in visits.values()) { result.add(entry) };

    result.toArray();
  };

  // Get the latest post by a specific user (public - no auth needed)
  public query func getLatestPostByUser(user : Principal) : async ?Post {
    let userPosts = List.empty<Post>();
    for ((_, post) in postsMap.entries()) {
      if (post.authorPrincipal == user) {
        userPosts.add(post);
      };
    };

    if (userPosts.isEmpty()) { return null };

    let sortedPosts = userPosts.toArray().sort(
      func(a : Post, b : Post) : Order.Order {
        Int.compare(b.timestamp, a.timestamp);
      }
    );

    if (sortedPosts.size() > 0) { ?sortedPosts[0] } else { null };
  };

  // Check if a user has posted since a given timestamp (public - no auth needed)
  public query func hasNewPostSince(
    user : Principal,
    since : Int,
  ) : async Bool {
    for ((_, post) in postsMap.entries()) {
      if (post.authorPrincipal == user and post.timestamp > since) {
        return true;
      };
    };
    false;
  };

  // Internal helper: add a message to the conversation store
  func addMessageToConversationInternal(
    sender : Principal,
    recipient : Principal,
    message : Message,
  ) {
    let existingConvo = conversationMessages.get(sender);

    switch (existingConvo) {
      case (?recipientConvoMap) {
        let recipientMessagesMap = recipientConvoMap.get(recipient);
        switch (recipientMessagesMap) {
          case (?messages) {
            messages.add(message);
          };
          case (null) {
            let newList = List.empty<Message>();
            newList.add(message);
            recipientConvoMap.add(recipient, newList);
          };
        };
      };
      case (null) {
        let newConvoList = List.empty<Message>();
        newConvoList.add(message);
        let newRecipients = Map.empty<Principal, List.List<Message>>();
        newRecipients.add(recipient, newConvoList);
        conversationMessages.add(sender, newRecipients);
      };
    };
  };

  // Internal helper: update conversation metadata
  func updateConversationInternal(participant1 : Principal, participant2 : Principal) {
    let participants = (participant1, participant2);
    let conversation = {
      participants;
      lastUpdated = Time.now();
    };

    let existingConvos = conversations.get(participant1);
    switch (existingConvos) {
      case (?allConversations) {
        allConversations.add(participant2, conversation);
      };
      case (null) {
        let newConvoMap = Map.empty<Principal, Conversation>();
        newConvoMap.add(participant2, conversation);
        conversations.add(participant1, newConvoMap);
      };
    };
  };

  // Send a message (authenticated users only)
  public shared ({ caller }) func sendMessage(
    recipient : Principal,
    content : Text,
    postId : ?Nat,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    let message : Message = {
      sender = caller;
      recipient;
      content;
      timestamp = Time.now();
      postId;
      read = false;
    };

    addMessageToConversationInternal(caller, recipient, message);
    addMessageToConversationInternal(recipient, caller, message);
    updateConversationInternal(caller, recipient);
    updateConversationInternal(recipient, caller);

    createNotification(recipient, #message, caller, postId);
  };

  // Get a list of all conversations for the caller
  public query ({ caller }) func getConversations() : async [Conversation] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their conversations");
    };
    switch (conversations.get(caller)) {
      case (?allConversations) {
        allConversations.values().toArray();
      };
      case (null) { [] };
    };
  };

  // Get messages for a specific conversation (caller must be a participant)
  public query ({ caller }) func getMessages(otherParticipant : Principal) : async [Message] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their messages");
    };
    switch (conversationMessages.get(caller)) {
      case (?recipientConvoMap) {
        switch (recipientConvoMap.get(otherParticipant)) {
          case (?messageList) {
            messageList.toArray();
          };
          case (null) { [] };
        };
      };
      case (null) { [] };
    };
  };

  // Mark all messages as read in a conversation
  public shared ({ caller }) func markMessagesRead(otherParticipant : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can mark messages as read");
    };
    switch (conversationMessages.get(caller)) {
      case (?recipientConvoMap) {
        switch (recipientConvoMap.get(otherParticipant)) {
          case (?messages) {
            let newMessages = messages.map<Message, Message>(
              func(msg) { { msg with read = true } }
            );
            recipientConvoMap.add(otherParticipant, newMessages);
          };
          case (null) {};
        };
      };
      case (null) {};
    };
  };

  // Follow a user (authenticated users only)
  public shared ({ caller }) func followUser(target : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can follow others");
    };

    switch (followingMap.get(caller)) {
      case (?following) {
        following.add(target);
      };
      case (null) {
        let newFollowing = Set.empty<Principal>();
        newFollowing.add(target);
        followingMap.add(caller, newFollowing);
      };
    };

    switch (followersMap.get(target)) {
      case (?followers) {
        followers.add(caller);
      };
      case (null) {
        let newFollowers = Set.empty<Principal>();
        newFollowers.add(caller);
        followersMap.add(target, newFollowers);
      };
    };

    createNotification(target, #new_shadow, caller, null);
  };

  // Unfollow a user (authenticated users only)
  public shared ({ caller }) func unfollowUser(target : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can unfollow others");
    };

    switch (followingMap.get(caller)) {
      case (?following) {
        following.remove(target);
        if (following.isEmpty()) {
          followingMap.remove(caller);
        };
      };
      case (null) {};
    };

    switch (followersMap.get(target)) {
      case (?followers) {
        followers.remove(caller);
        if (followers.isEmpty()) {
          followersMap.remove(target);
        };
      };
      case (null) {};
    };
  };

  // Get followers for a user (public)
  public query func getFollowers(user : Principal) : async [Principal] {
    switch (followersMap.get(user)) {
      case (?followers) {
        followers.toArray();
      };
      case (null) { [] };
    };
  };

  // Get users being followed by a user (public)
  public query func getFollowing(user : Principal) : async [Principal] {
    switch (followingMap.get(user)) {
      case (?following) {
        following.toArray();
      };
      case (null) { [] };
    };
  };

  // Check if the caller is following another user
  public query ({ caller }) func isFollowing(target : Principal) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can check follow status");
    };
    switch (followingMap.get(caller)) {
      case (?following) {
        following.contains(target);
      };
      case (null) { false };
    };
  };

  // Ranking creators by followers (public endpoint)
  type CreatorRanking = {
    principal : Principal;
    username : Text;
    profilePicBlob : ?Storage.ExternalBlob;
    followerCount : Nat;
  };

  func compareByFollowersDesc(a : CreatorRanking, b : CreatorRanking) : Order.Order {
    Nat.compare(b.followerCount, a.followerCount);
  };

  public query func getTopCreatorsByShadows(limit : Nat) : async [CreatorRanking] {
    let rankings = List.empty<CreatorRanking>();

    for ((principal, profile) in userProfiles.entries()) {
      let followerCount = switch (followersMap.get(principal)) {
        case (?followers) { followers.size() };
        case (null) { 0 };
      };

      let ranking = {
        principal;
        username = profile.data.displayName;
        profilePicBlob = profile.data.profilePicture;
        followerCount;
      };

      rankings.add(ranking);
    };

    rankings.toArray().sort(compareByFollowersDesc).sliceToArray(
      0,
      Nat.min(limit, rankings.size()),
    );
  };

  // Internal: create a notification for a user
  func createNotification(
    user : Principal,
    notificationType : NotificationType,
    from : Principal,
    postId : ?Nat,
  ) {
    let newNotification = {
      id = notificationIdCounter;
      notificationType;
      fromPrincipal = from;
      timestamp = Time.now();
      read = false;
      postId;
    };

    let userNotifications = notifications.get(user);
    switch (userNotifications) {
      case (?userNotificationMap) {
        userNotificationMap.add(notificationIdCounter, newNotification);
      };
      case (null) {
        let newMap = Map.empty<Nat, Notification>();
        newMap.add(notificationIdCounter, newNotification);
        notifications.add(user, newMap);
      };
    };

    notificationIdCounter += 1;
  };

  // Get all notifications for the caller
  public query ({ caller }) func getNotifications() : async [Notification] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their notifications");
    };
    switch (notifications.get(caller)) {
      case (?userNotifications) {
        userNotifications.values().toArray();
      };
      case (null) { [] };
    };
  };

  // Mark a notification as read
  public shared ({ caller }) func markNotificationRead(notificationId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can mark notifications as read");
    };
    switch (notifications.get(caller)) {
      case (?userNotifications) {
        switch (userNotifications.get(notificationId)) {
          case (?notification) {
            let updatedNotification = { notification with read = true };
            userNotifications.add(notificationId, updatedNotification);
          };
          case (null) {};
        };
      };
      case (null) {};
    };
  };

  // Get caller's own profile (authenticated users only)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfileData {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    switch (userProfiles.get(caller)) {
      case (?profile) { ?profile.data };
      case (null) { null };
    };
  };

  // Save caller's own profile (authenticated users only)
  public shared ({ caller }) func saveCallerUserProfile(profileData : UserProfileData) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save their profile");
    };

    switch (handleToPrincipalMap.get(profileData.handle)) {
      case (?existingPrincipal) {
        if (existingPrincipal != caller) {
          Runtime.trap("Handle already in use by another user");
        };
      };
      case (null) {};
    };

    switch (userProfiles.get(caller)) {
      case (?existingProfile) {
        if (existingProfile.data.handle != profileData.handle) {
          handleToPrincipalMap.remove(existingProfile.data.handle);
        };
      };
      case (null) {};
    };

    handleToPrincipalMap.add(profileData.handle, caller);
    userProfiles.add(caller, { caller; data = profileData });
  };

  // Get another user's profile by principal (public)
  public query func getUserProfile(principal : Principal) : async ?UserProfileData {
    switch (userProfiles.get(principal)) {
      case (?profile) { ?profile.data };
      case (null) { null };
    };
  };

  // Create or update profile (authenticated users only)
  public shared ({ caller }) func createOrUpdateProfile(profileData : UserProfileData) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create or update profiles");
    };

    switch (handleToPrincipalMap.get(profileData.handle)) {
      case (?existingPrincipal) {
        if (existingPrincipal != caller) {
          Runtime.trap("Handle already in use by another user");
        };
      };
      case (null) {};
    };

    switch (userProfiles.get(caller)) {
      case (?existingProfile) {
        if (existingProfile.data.handle != profileData.handle) {
          handleToPrincipalMap.remove(existingProfile.data.handle);
        };
      };
      case (null) {};
    };

    handleToPrincipalMap.add(profileData.handle, caller);
    userProfiles.add(caller, { caller; data = profileData });
  };

  // Get profile by principal (public)
  public query func getProfileByPrincipal(principal : Principal) : async ?UserProfileData {
    switch (userProfiles.get(principal)) {
      case (?profile) { ?profile.data };
      case (null) { null };
    };
  };

  // Get profile by handle (public)
  public query func getProfileByHandle(handle : Text) : async ?UserProfileData {
    switch (handleToPrincipalMap.get(handle)) {
      case (?principal) {
        switch (userProfiles.get(principal)) {
          case (?profile) { ?profile.data };
          case (null) { null };
        };
      };
      case (null) { null };
    };
  };

  // Search handles by prefix (public)
  public query func searchHandles(prefix : Text) : async [Text] {
    handleToPrincipalMap.keys().toArray().filter(
      func(handle : Text) : Bool {
        handle.startsWith(#text prefix);
      }
    );
  };

  // Create a post (authenticated users only)
  public shared ({ caller }) func createPost(post : PostInput) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create posts");
    };

    let newPost : Post = {
      id = postCounter;
      authorPrincipal = caller;
      authorName = post.authorName;
      media = post.media;
      mediaType = post.mediaType;
      caption = post.caption;
      timestamp = Time.now();
      likeCount = 0;
      viewCount = 0;
    };

    postsMap.add(postCounter, newPost);
    postCounter += 1;
    newPost.id;
  };

  // Custom comparator for sorting posts by timestamp DESC (newest first)
  func compareByTimestampDesc(a : Post, b : Post) : Order.Order {
    Int.compare(b.timestamp, a.timestamp);
  };

  // Get all posts sorted by timestamp descending (public)
  public query func getAllPosts() : async [Post] {
    postsMap.values().toArray().sort(compareByTimestampDesc);
  };

  // Get posts by user (public)
  public query func getPostsByUser(authorPrincipal : Principal) : async [Post] {
    postsMap.values().toArray().filter(
      func(post : Post) : Bool {
        post.authorPrincipal == authorPrincipal;
      }
    );
  };

  // Like a post (authenticated users only)
  public shared ({ caller }) func likePost(postId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can like posts");
    };
    switch (postsMap.get(postId)) {
      case (?post) {
        let updatedPost = { post with likeCount = post.likeCount + 1 };
        postsMap.add(postId, updatedPost);
      };
      case (null) { () };
    };
  };

  // Record a view (public - anyone can record a view)
  public shared func recordView(postId : Nat) : async () {
    switch (postsMap.get(postId)) {
      case (?post) {
        let updatedPost = { post with viewCount = post.viewCount + 1 };
        postsMap.add(postId, updatedPost);
      };
      case (null) { () };
    };
  };

  // Add a comment (authenticated users only)
  public shared ({ caller }) func addComment(
    postId : Nat,
    authorName : Text,
    text : Text,
  ) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add comments");
    };

    let newComment : Comment = {
      id = commentCounter;
      postId;
      authorPrincipal = caller;
      authorName;
      text;
      timestamp = Time.now();
    };

    commentsMap.add(commentCounter, newComment);
    commentCounter += 1;
    newComment.id;
  };

  // Get comments for a post (public)
  public query func getComments(postId : Nat) : async [Comment] {
    commentsMap.values().toArray().filter(
      func(comment : Comment) : Bool {
        comment.postId == postId;
      }
    );
  };
};
