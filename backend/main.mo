import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
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

  let postsMap = Map.empty<Nat, Post>();
  let commentsMap = Map.empty<Nat, Comment>();
  var postCounter = 0;
  var commentCounter = 0;

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

  // friendRequests keyed by recipient principal, storing list of requests sent to that recipient
  let friendRequests = Map.empty<Principal, List.List<FriendRequest>>();
  var friendCount = 0;

  // Friend Request Logic

  // Send a friend request to receiver; caller must be an authenticated user
  public shared ({ caller }) func sendFriendRequest(receiver : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can send friend requests");
    };

    if (caller == receiver) {
      Runtime.trap("Cannot send a friend request to yourself");
    };

    let newRequest : FriendRequest = {
      sender = caller;
      recipient = receiver;
      status = #pending;
      timestamp = Time.now();
    };

    switch (friendRequests.get(receiver)) {
      case (?requests) {
        // Prevent duplicate pending requests
        var duplicate = false;
        for (req in requests.values()) {
          if (req.sender == caller and req.status == #pending) {
            duplicate := true;
          };
        };
        if (duplicate) {
          Runtime.trap("Friend request already exists");
        };
        requests.add(newRequest);
      };
      case (null) {
        let newList = List.empty<FriendRequest>();
        newList.add(newRequest);
        friendRequests.add(receiver, newList);
      };
    };
  };

  // Respond to a friend request; caller is the recipient, sender is the one who sent the request
  public shared ({ caller }) func respondToFriendRequest(sender : Principal, accept : Bool) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can respond to friend requests");
    };

    switch (friendRequests.get(caller)) {
      case (?requests) {
        var found = false;
        let updatedList = List.empty<FriendRequest>();
        for (request in requests.values()) {
          if (request.sender == sender and request.status == #pending) {
            found := true;
            let newStatus : FriendRequestStatus = if (accept) { #accepted } else { #declined };
            updatedList.add({ request with status = newStatus });
          } else {
            updatedList.add(request);
          };
        };
        if (not found) {
          Runtime.trap("No pending friend request from that sender");
        };
        requests.clear();
        for (req in updatedList.values()) {
          requests.add(req);
        };
      };
      case (null) {
        Runtime.trap("No friend requests found");
      };
    };
  };

  // Cancel an outgoing friend request; caller is the original sender, receiver is the intended recipient
  public shared ({ caller }) func cancelFriendRequest(receiver : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can cancel friend requests");
    };

    switch (friendRequests.get(receiver)) {
      case (?requests) {
        var found = false;
        let filteredList = List.empty<FriendRequest>();
        for (req in requests.values()) {
          if (req.sender == caller and req.status == #pending) {
            found := true;
            // skip this request (cancel it)
          } else {
            filteredList.add(req);
          };
        };
        if (not found) {
          Runtime.trap("No pending friend request to cancel");
        };
        requests.clear();
        for (req in filteredList.values()) {
          requests.add(req);
        };
      };
      case (null) {
        Runtime.trap("No friend requests to cancel");
      };
    };
  };

  // Unfriend: remove accepted friendship between caller and friendPrincipal
  public shared ({ caller }) func unfriend(friendPrincipal : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can unfriend");
    };

    // Remove accepted request stored under caller (where caller is recipient)
    switch (friendRequests.get(caller)) {
      case (?requests) {
        let filtered = List.empty<FriendRequest>();
        for (req in requests.values()) {
          if (not (req.sender == friendPrincipal and req.status == #accepted)) {
            filtered.add(req);
          };
        };
        requests.clear();
        for (req in filtered.values()) {
          requests.add(req);
        };
      };
      case (null) {};
    };

    // Remove accepted request stored under friendPrincipal (where friendPrincipal is recipient)
    switch (friendRequests.get(friendPrincipal)) {
      case (?requests) {
        let filtered = List.empty<FriendRequest>();
        for (req in requests.values()) {
          if (not (req.sender == caller and req.status == #accepted)) {
            filtered.add(req);
          };
        };
        requests.clear();
        for (req in filtered.values()) {
          requests.add(req);
        };
      };
      case (null) {};
    };
  };

  // Get all incoming (pending) friend requests for the caller
  public query ({ caller }) func getIncomingFriendRequests() : async [FriendRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view incoming friend requests");
    };

    switch (friendRequests.get(caller)) {
      case (?requests) {
        let result = List.empty<FriendRequest>();
        for (req in requests.values()) {
          if (req.status == #pending) {
            result.add(req);
          };
        };
        result.toArray();
      };
      case (null) { [] };
    };
  };

  // Get all outgoing (pending) friend requests sent by the caller
  public query ({ caller }) func getOutgoingFriendRequests() : async [FriendRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view outgoing friend requests");
    };

    let result = List.empty<FriendRequest>();
    for ((_, requests) in friendRequests.entries()) {
      for (req in requests.values()) {
        if (req.sender == caller and req.status == #pending) {
          result.add(req);
        };
      };
    };
    result.toArray();
  };

  // Get the list of accepted friends for the caller
  public query ({ caller }) func getFriendsList() : async [Principal] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their friends list");
    };

    let friends = List.empty<Principal>();
    for ((_, requests) in friendRequests.entries()) {
      for (req in requests.values()) {
        if (req.status == #accepted) {
          if (req.sender == caller) {
            friends.add(req.recipient);
          } else if (req.recipient == caller) {
            friends.add(req.sender);
          };
        };
      };
    };
    friends.toArray();
  };

  // Get the friendship status between the caller and another principal
  public query ({ caller }) func getFriendshipStatus(otherPrincipal : Principal) : async FriendshipStatusEnum {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can check friendship status");
    };

    // Check requests stored under caller (caller is recipient)
    switch (friendRequests.get(caller)) {
      case (?requests) {
        for (req in requests.values()) {
          if (req.sender == otherPrincipal) {
            switch (req.status) {
              case (#pending) { return #pendingIncoming };
              case (#accepted) { return #friends };
              case (#declined) {};
            };
          };
        };
      };
      case (null) {};
    };

    // Check requests stored under otherPrincipal (caller is sender)
    switch (friendRequests.get(otherPrincipal)) {
      case (?requests) {
        for (req in requests.values()) {
          if (req.sender == caller) {
            switch (req.status) {
              case (#pending) { return #pendingOutgoing };
              case (#accepted) { return #friends };
              case (#declined) {};
            };
          };
        };
      };
      case (null) {};
    };

    #notConnected;
  };

  // New searchUsers endpoint
  public shared ({ caller }) func searchUsers(searchStr : Text) : async [UserProfileSummary] {
    let entries = userProfiles.entries();
    let results = List.empty<UserProfileSummary>();

    for ((principal, user) in entries) {
      let handleMatches = user.data.handle.contains(#text searchStr);
      let displayNameMatches = user.data.displayName.contains(#text searchStr);

      if (handleMatches or displayNameMatches) {
        let postCount = postsMap.values().toArray().filter(
          func(post) { post.authorPrincipal == principal }
        ).size();

        let followersCount = switch (followersMap.get(principal)) {
          case (?followers) { followers.size() };
          case (null) { 0 };
        };

        let followingCount = switch (followingMap.get(principal)) {
          case (?following) { following.size() };
          case (null) { 0 };
        };

        let summary : UserProfileSummary = {
          principal;
          handle = user.data.handle;
          displayName = user.data.displayName;
          bio = user.data.bio;
          avatarUrl = user.data.profilePicture;
          postCount;
          followerCount = followersCount;
          followingCount;
        };
        results.add(summary);
      };
    };

    results.toArray();
  };

  // Messaging System

  // Send a message to another user, optionally referencing a post
  public shared ({ caller }) func sendMessage(recipient : Principal, content : Text, postId : ?Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    let newMessage = {
      sender = caller;
      recipient;
      content;
      timestamp = Time.now();
      postId;
      read = false;
    };

    addMessageToConversationInternal(caller, recipient, newMessage);
    addMessageToConversationInternal(recipient, caller, newMessage);

    // Update conversations for both participants
    updateConversationInternal(caller, recipient);
    updateConversationInternal(recipient, caller);

    // Create a notification for the recipient
    createNotification(
      recipient,
      #message,
      caller,
      postId,
    );
  };

  func addMessageToConversationInternal(sender : Principal, recipient : Principal, message : Message) {
    let existingConvo = conversationMessages.get(sender);

    switch (existingConvo) {
      case (?recipientConvoMap) {
        // Check if conversation with recipient exists
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
        // Create new conversations map for sender
        let newConvoList = List.empty<Message>();
        newConvoList.add(message);

        let newRecipients = Map.empty<Principal, List.List<Message>>();
        newRecipients.add(recipient, newConvoList);
        conversationMessages.add(sender, newRecipients);
      };
    };
  };

  // Update the conversation metadata
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

  // Get a list of all conversations for a user
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

  // Get messages for a specific conversation
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

  // Focusing/Unfollowing (Shadows)

  // Follow a user
  public shared ({ caller }) func followUser(target : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can follow others");
    };

    // Update following map for caller
    let callerFollowing = switch (followingMap.get(caller)) {
      case (?following) {
        following.add(target);
        following;
      };
      case (null) {
        let newFollowing = Set.empty<Principal>();
        newFollowing.add(target);
        followingMap.add(caller, newFollowing);
        newFollowing;
      };
    };

    // Update followers map for the target
    let targetFollowers = switch (followersMap.get(target)) {
      case (?followers) {
        followers.add(caller);
        followers;
      };
      case (null) {
        let newFollowers = Set.empty<Principal>();
        newFollowers.add(caller);
        followersMap.add(target, newFollowers);
        newFollowers;
      };
    };

    // Create a notification for the target
    createNotification(target, #new_shadow, caller, null);
  };

  // Unfollow a user
  public shared ({ caller }) func unfollowUser(target : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can unfollow others");
    };

    // Remove target from caller's following set
    switch (followingMap.get(caller)) {
      case (?following) {
        following.remove(target);
        if (following.isEmpty()) {
          followingMap.remove(caller);
        };
      };
      case (null) {};
    };

    // Remove caller from target's followers set
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

  // Get followers (shadows) for a user - public, no auth needed
  public query func getFollowers(user : Principal) : async [Principal] {
    switch (followersMap.get(user)) {
      case (?followers) {
        followers.toArray();
      };
      case (null) { [] };
    };
  };

  // Get users being followed by a user - public, no auth needed
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

  // Notification System

  func createNotification(user : Principal, notificationType : NotificationType, from : Principal, postId : ?Nat) {
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

  // Get all notifications for a user
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

  // Required by instructions: get caller's own profile (authenticated users only)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfileData {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    userProfiles.get(caller).map<UserProfile, UserProfileData>(func(profile) { profile.data });
  };

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

  // Required by instructions: get another user's profile by principal (public)
  public query ({ caller }) func getUserProfile(principal : Principal) : async ?UserProfileData {
    userProfiles.get(principal).map<UserProfile, UserProfileData>(func(profile) { profile.data });
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
    userProfiles.get(principal).map<UserProfile, UserProfileData>(func(profile) { profile.data });
  };

  // Get profile by handle (public)
  public query func getProfileByHandle(handle : Text) : async ?UserProfileData {
    switch (handleToPrincipalMap.get(handle)) {
      case (?principal) {
        userProfiles.get(principal).map<UserProfile, UserProfileData>(func(profile) { profile.data });
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

  // Get all posts (public)
  public query func getAllPosts() : async [Post] {
    postsMap.values().toArray();
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
  public shared ({ caller }) func addComment(postId : Nat, authorName : Text, text : Text) : async Nat {
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
