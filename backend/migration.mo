import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  // Old profile data type with profilePicture field
  type OldUserProfileData = {
    handle : Text;
    displayName : Text;
    bio : Text;
    bannerImage : ?Storage.ExternalBlob;
    profilePicture : ?Storage.ExternalBlob;
  };

  type OldUserProfile = {
    caller : Principal;
    data : OldUserProfileData;
  };

  // Old actor type
  type OldActor = {
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  // New profile data type with profilePhoto field
  type NewUserProfileData = {
    handle : Text;
    displayName : Text;
    bio : Text;
    bannerImage : ?Storage.ExternalBlob;
    profilePhoto : ?Storage.ExternalBlob;
  };

  type NewUserProfile = {
    caller : Principal;
    data : NewUserProfileData;
  };

  // New actor type
  type NewActor = {
    userProfiles : Map.Map<Principal, NewUserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    let newProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(_principal, oldProfile) {
        {
          oldProfile with
          data = {
            oldProfile.data with
            profilePhoto = oldProfile.data.profilePicture
          }
        };
      }
    );
    { userProfiles = newProfiles };
  };
};
