import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type OldUserProfileData = {
    handle : Text;
    displayName : Text;
    bio : Text;
    profilePicture : ?Storage.ExternalBlob;
  };

  type OldNotificationType = {
    #new_shadow;
    #message;
    #comment;
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

  type OldNotification = {
    id : Nat;
    notificationType : OldNotificationType;
    fromPrincipal : Principal;
    timestamp : Int;
    read : Bool;
    postId : ?Nat;
  };

  type OldConversation = {
    participants : (Principal, Principal);
    lastUpdated : Int;
  };

  type OldMessage = {
    sender : Principal;
    recipient : Principal;
    content : Text;
    timestamp : Int;
    postId : ?Nat;
    read : Bool;
  };

  type OldActor = {
    postsMap : Map.Map<Nat, OldPost>;
    commentsMap : Map.Map<Nat, OldComment>;
    postCounter : Nat;
    commentCounter : Nat;
    notifications : Map.Map<Principal, Map.Map<Nat, OldNotification>>;
    notificationIdCounter : Nat;
    conversations : Map.Map<Principal, Map.Map<Principal, OldConversation>>;
    conversationMessages : Map.Map<Principal, Map.Map<Principal, List.List<OldMessage>>>;
  };

  type NewActor = {
    postsMap : Map.Map<Nat, OldPost>;
    commentsMap : Map.Map<Nat, OldComment>;
    postCounter : Nat;
    commentCounter : Nat;
    notifications : Map.Map<Principal, Map.Map<Nat, OldNotification>>;
    notificationIdCounter : Nat;
    conversations : Map.Map<Principal, Map.Map<Principal, OldConversation>>;
    conversationMessages : Map.Map<Principal, Map.Map<Principal, List.List<OldMessage>>>;
    visitHistory : Map.Map<Principal, List.List<Principal>>;
  };

  public func run(old : OldActor) : NewActor {
    {
      postsMap = old.postsMap;
      commentsMap = old.commentsMap;
      postCounter = old.postCounter;
      commentCounter = old.commentCounter;
      notifications = old.notifications;
      notificationIdCounter = old.notificationIdCounter;
      conversations = old.conversations;
      conversationMessages = old.conversationMessages;
      visitHistory = Map.empty<Principal, List.List<Principal>>();
    };
  };
};
