import Map "mo:core/Map";
import Storage "blob-storage/Storage";
import Principal "mo:core/Principal";

module {
  type OldUserProfileInput = {
    name : Text;
    username : Text;
    handle : Text;
    bio : Text;
    location : Text;
    profilePhoto : ?Storage.ExternalBlob;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, OldUserProfileInput>;
  };

  type NewUserProfileInput = {
    name : Text;
    username : Text;
    handle : Text;
    bio : Text;
    location : Text;
    profilePhoto : ?Storage.ExternalBlob;
    bannerImage : ?Storage.ExternalBlob;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, NewUserProfileInput>;
  };

  public func run(old : OldActor) : NewActor {
    let newProfiles = old.userProfiles.map<Principal, OldUserProfileInput, NewUserProfileInput>(
      func(_principal, oldProfile) {
        { oldProfile with bannerImage = null };
      }
    );
    { userProfiles = newProfiles };
  };
};
