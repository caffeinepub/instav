import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Storage "blob-storage/Storage";

module {
  type OldActor = {
    postsMap : Map.Map<Nat, { id : Nat; authorPrincipal : Principal; authorName : Text; media : ?Storage.ExternalBlob; mediaType : Text; caption : Text; timestamp : Int; likeCount : Nat; viewCount : Nat }>;
    commentsMap : Map.Map<Nat, { id : Nat; postId : Nat; authorPrincipal : Principal; authorName : Text; text : Text; timestamp : Int }>;
    postCounter : Nat;
    commentCounter : Nat;
    conversations : Map.Map<Principal, Map.Map<Principal, { participants : (Principal, Principal); lastUpdated : Int }>>;
    conversationMessages : Map.Map<Principal, Map.Map<Principal, List.List<{ sender : Principal; recipient : Principal; content : Text; timestamp : Int; postId : ?Nat; read : Bool }>>>;
    userProfiles : Map.Map<Principal, { caller : Principal; data : { handle : Text; displayName : Text; bio : Text; profilePicture : ?Storage.ExternalBlob } }>;
    handleToPrincipalMap : Map.Map<Text, Principal>;
    notifications : Map.Map<Principal, Map.Map<Nat, { id : Nat; notificationType : { #new_shadow; #message; #comment }; fromPrincipal : Principal; timestamp : Int; read : Bool; postId : ?Nat }>>;
    notificationIdCounter : Nat;
    followingMap : Map.Map<Principal, Set.Set<Principal>>;
    followersMap : Map.Map<Principal, Set.Set<Principal>>;
  };

  // New actor type including friend system
  type NewActor = {
    postsMap : Map.Map<Nat, { id : Nat; authorPrincipal : Principal; authorName : Text; media : ?Storage.ExternalBlob; mediaType : Text; caption : Text; timestamp : Int; likeCount : Nat; viewCount : Nat }>;
    commentsMap : Map.Map<Nat, { id : Nat; postId : Nat; authorPrincipal : Principal; authorName : Text; text : Text; timestamp : Int }>;
    postCounter : Nat;
    commentCounter : Nat;
    conversations : Map.Map<Principal, Map.Map<Principal, { participants : (Principal, Principal); lastUpdated : Int }>>;
    conversationMessages : Map.Map<Principal, Map.Map<Principal, List.List<{ sender : Principal; recipient : Principal; content : Text; timestamp : Int; postId : ?Nat; read : Bool }>>>;
    userProfiles : Map.Map<Principal, { caller : Principal; data : { handle : Text; displayName : Text; bio : Text; profilePicture : ?Storage.ExternalBlob } }>;
    handleToPrincipalMap : Map.Map<Text, Principal>;
    notifications : Map.Map<Principal, Map.Map<Nat, { id : Nat; notificationType : { #new_shadow; #message; #comment }; fromPrincipal : Principal; timestamp : Int; read : Bool; postId : ?Nat }>>;
    notificationIdCounter : Nat;
    followingMap : Map.Map<Principal, Set.Set<Principal>>;
    followersMap : Map.Map<Principal, Set.Set<Principal>>;
    friendRequests : Map.Map<Principal, List.List<{ sender : Principal; recipient : Principal; status : { #pending; #accepted; #declined }; timestamp : Int }>>;
    friendCount : Nat;
  };

  public func run(old : OldActor) : NewActor {
    {
      postsMap = old.postsMap.map<Nat, { id : Nat; authorPrincipal : Principal; authorName : Text; media : ?Storage.ExternalBlob; mediaType : Text; caption : Text; timestamp : Int; likeCount : Nat; viewCount : Nat }, { id : Nat; authorPrincipal : Principal; authorName : Text; media : ?Storage.ExternalBlob; mediaType : Text; caption : Text; timestamp : Int; likeCount : Nat; viewCount : Nat }>(
        func(_id, oldPost) { oldPost },
      );
      commentsMap = old.commentsMap;
      postCounter = old.postCounter;
      commentCounter = old.commentCounter;
      conversations = old.conversations;
      conversationMessages = old.conversationMessages;
      userProfiles = old.userProfiles.map<Principal, { caller : Principal; data : { handle : Text; displayName : Text; bio : Text; profilePicture : ?Storage.ExternalBlob } }, { caller : Principal; data : { handle : Text; displayName : Text; bio : Text; profilePicture : ?Storage.ExternalBlob } }>(
        func(_principal, oldProfile) { oldProfile },
      );
      handleToPrincipalMap = old.handleToPrincipalMap;
      notifications = old.notifications;
      notificationIdCounter = old.notificationIdCounter;
      followingMap = old.followingMap;
      followersMap = old.followersMap;
      friendRequests = Map.empty<Principal, List.List<{ sender : Principal; recipient : Principal; status : { #pending; #accepted; #declined }; timestamp : Int }>>();
      friendCount = 0;
    };
  };
};
