import Map "mo:core/Map";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  // Types from old state before migration.
  type OldActor = {
    followingMap : Map.Map<Principal, Principal>;
    followersMap : Map.Map<Principal, Map.Map<Principal, ()>>;
  };

  // Types for new persistent state.
  type NewActor = {
    followingMap : Map.Map<Principal, Set.Set<Principal>>;
    followersMap : Map.Map<Principal, Set.Set<Principal>>;
  };

  public func run(old : OldActor) : NewActor {
    let newFollowingMap = old.followingMap.map<Principal, Principal, Set.Set<Principal>>(
      func(_follower, following) {
        let newSet = Set.empty<Principal>();
        newSet.add(following);
        newSet;
      }
    );

    let newFollowersMap = old.followersMap.map<Principal, Map.Map<Principal, ()>, Set.Set<Principal>>(
      func(_followee, followers) {
        let newSet = Set.empty<Principal>();
        followers.keys().forEach(func(follower) { newSet.add(follower) });
        newSet;
      }
    );

    {
      followingMap = newFollowingMap;
      followersMap = newFollowersMap;
    };
  };
};
