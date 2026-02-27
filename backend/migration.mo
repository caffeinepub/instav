import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Storage "blob-storage/Storage";

module {
  type OldUserProfile = {
    name : Text;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  type NewUserProfileData = {
    handle : Text;
    displayName : Text;
    bio : Text;
    profilePicture : ?Storage.ExternalBlob;
  };

  type NewUserProfile = {
    caller : Principal;
    data : NewUserProfileData;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, NewUserProfile>;
    handleToPrincipalMap : Map.Map<Text, Principal>;
  };

  public func run(old : OldActor) : NewActor {
    let newUserProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(principal : Principal, oldProfile : OldUserProfile) : NewUserProfile {
        {
          caller = principal;
          data = {
            handle = "";
            displayName = oldProfile.name;
            bio = "";
            profilePicture = null;
          };
        };
      }
    );

    {
      userProfiles = newUserProfiles;
      handleToPrincipalMap = Map.empty<Text, Principal>();
    };
  };
};
