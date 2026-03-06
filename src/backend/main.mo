import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";


import Storage "blob-storage/Storage";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
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

  public type PostInput = {
    authorName : Text;
    media : ?Storage.ExternalBlob;
    mediaType : Text;
    caption : Text;
  };

  public type UserProfileInput = {
    name : Text;
    username : Text;
    handle : Text;
    bio : Text;
    location : Text;
    profilePhoto : ?Storage.ExternalBlob;
    bannerImage : ?Storage.ExternalBlob;
  };

  public type UserProfileData = UserProfileInput;

  type UserProfile = UserProfileInput;

  public type UserIdentifier = {
    #principal : Principal;
    #handle : Text;
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

  let likedPostsMap = Map.empty<Principal, Set.Set<Nat>>();

  type UserProfileSummary = {
    principal : Principal;
    handle : Text;
    displayName : Text;
    bio : Text;
    avatarUrl : ?Storage.ExternalBlob;
    bannerImage : ?Storage.ExternalBlob;
    postCount : Nat;
    followerCount : Nat;
    followingCount : Nat;
  };

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

  let friendRequests = Map.empty<Principal, List.List<FriendRequest>>();
  var friendCount = 0;

  // Required by frontend: get caller's own profile
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    userProfiles.get(caller);
  };

  // Required by frontend: save caller's own profile
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfileInput) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save their profile");
    };
    userProfiles.add(caller, profile);
  };

  // Required by frontend: get another user's profile (caller can view own or admin can view any)
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Update current caller's full profile data
  public shared ({ caller }) func updateProfile(newProfileData : UserProfileInput) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update their profile");
    };
    userProfiles.add(caller, newProfileData);
  };

  // Get current caller's full profile data
  public query ({ caller }) func getMyProfile() : async UserProfileInput {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    switch (userProfiles.get(caller)) {
      case (?profile) { profile };
      case (null) { Runtime.trap("Profile not found") };
    };
  };

  // Retrieve a public profile by identifier (principal or handle) - public, no auth required
  public query ({ caller }) func getProfile(identifier : UserIdentifier) : async ?UserProfileInput {
    switch (identifier) {
      case (#principal principal) {
        userProfiles.get(principal);
      };
      case (#handle handle) {
        switch (handleToPrincipalMap.get(handle)) {
          case (?principal) { userProfiles.get(principal) };
          case (null) { null };
        };
      };
    };
  };

  // Set the mapping handle -> principal; only authenticated users can register a handle
  public shared ({ caller }) func registerHandle(handle : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can register a handle");
    };
    switch (handleToPrincipalMap.get(handle)) {
      case (?_existing) {
        Runtime.trap("Handle already in use");
      };
      case (null) {
        handleToPrincipalMap.add(handle, caller);
      };
    };
  };

  // Delete a handle; only the owning user can delete their handle
  public shared ({ caller }) func deleteHandle(handle : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete a handle");
    };
    switch (handleToPrincipalMap.get(handle)) {
      case (?principal) {
        if (principal != caller) {
          Runtime.trap("Unauthorized: Cannot delete handle you don't own");
        };
        handleToPrincipalMap.remove(handle);
      };
      case (null) {
        Runtime.trap("Handle not found");
      };
    };
  };

  // Look up principal by handle - public, no auth required
  public query ({ caller }) func lookupPrincipal(handle : Text) : async ?Principal {
    handleToPrincipalMap.get(handle);
  };

  // Look up handle by principal - public, no auth required
  public query ({ caller }) func lookupHandle(principal : Principal) : async ?Text {
    for ((handle, mappedPrincipal) in handleToPrincipalMap.entries()) {
      if (mappedPrincipal == principal) {
        return ?handle;
      };
    };
    null;
  };
};
