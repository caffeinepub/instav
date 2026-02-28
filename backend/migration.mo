import Map "mo:core/Map";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";

module {
  type OldActor = {
    postsMap : Map.Map<Nat, OldPost>;
    commentsMap : Map.Map<Nat, OldComment>;
    postCounter : Nat;
    commentCounter : Nat;
    accessControlState : AccessControl.AccessControlState;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    handleToPrincipalMap : Map.Map<Text, Principal>;
  };

  type OldPost = {
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

  type OldComment = {
    id : Nat;
    postId : Nat;
    authorPrincipal : Principal;
    authorName : Text;
    text : Text;
    timestamp : Int;
  };

  type OldUserProfileData = {
    handle : Text;
    displayName : Text;
    bio : Text;
    profilePicture : ?Storage.ExternalBlob;
  };

  type OldUserProfile = {
    caller : Principal;
    data : OldUserProfileData;
  };

  type NewActor = {
    postsMap : Map.Map<Nat, OldPost>;
    commentsMap : Map.Map<Nat, OldComment>;
    postCounter : Nat;
    commentCounter : Nat;
    accessControlState : AccessControl.AccessControlState;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    handleToPrincipalMap : Map.Map<Text, Principal>;
  };

  public func run(old : OldActor) : NewActor {
    old;
  };
};
