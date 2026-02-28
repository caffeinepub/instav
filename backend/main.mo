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
