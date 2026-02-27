import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Map "mo:core/Map";
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

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  let userProfiles = Map.empty<Principal, UserProfile>();
  let handleToPrincipalMap = Map.empty<Text, Principal>();

  // Required by instructions: get caller's own profile (authenticated users only)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfileData {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    userProfiles.get(caller).map<UserProfile, UserProfileData>(func(profile) { profile.data });
  };

  // Required by instructions: save caller's own profile (authenticated users only)
  public shared ({ caller }) func saveCallerUserProfile(profileData : UserProfileData) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save their profile");
    };

    // Check if handle is unique (excluding current user)
    switch (handleToPrincipalMap.get(profileData.handle)) {
      case (?existingPrincipal) {
        if (existingPrincipal != caller) {
          Runtime.trap("Handle already in use by another user");
        };
      };
      case (null) {};
    };

    // Remove old handle mapping if updating
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

    // Check if handle is unique (excluding current user)
    switch (handleToPrincipalMap.get(profileData.handle)) {
      case (?existingPrincipal) {
        if (existingPrincipal != caller) {
          Runtime.trap("Handle already in use by another user");
        };
      };
      case (null) {};
    };

    // Remove old handle mapping if updating
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
