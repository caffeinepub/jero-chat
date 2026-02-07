import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  type OldActor = {
    userPresence : Map.Map<Principal, Bool>;
  };

  type NewActor = {
    userPresence : Map.Map<Principal, (Bool, Time.Time)>;
  };

  public func run(old : OldActor) : NewActor {
    let newUserPresence = old.userPresence.map<Principal, Bool, (Bool, Time.Time)>(
      func(_principal, isOnline) {
        (isOnline, 0);
      }
    );
    { userPresence = newUserPresence };
  };
};
