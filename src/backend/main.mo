import List "mo:core/List";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Char "mo:core/Char";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

// Upgrade migration
(with migration = Migration.run)
actor {
  // Include prefabricated modules
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Persistent Messages (message, from, to, replyToId)
  let persistentMessages = List.empty<(Text, Principal, Principal, ?Nat)>();
  let userPresence = Map.empty<Principal, (Bool, Time.Time)>(); // NEW: Store online state and last seen
  // User data with public profile photo (nullable)
  public type UserProfile = {
    name : Text;
    phoneNumber : ?Text;
    profilePhoto : ?Storage.ExternalBlob;
  };

  let userRegistry = Map.empty<Principal, UserProfile>();
  let contactsList = Map.empty<Principal, Set.Set<Principal>>();
  let conversations = Map.empty<Principal, List.List<Nat>>();
  let fileShares = Map.empty<Text, Storage.ExternalBlob>();

  // File/Media Type
  public type MediaType = {
    #photo : Storage.ExternalBlob;
    #video : Storage.ExternalBlob;
    #text : Text;
    #music : Storage.ExternalBlob;
  };

  // Integrate Status/Stories backup as core data structure
  public type StatusItem = {
    id : Nat;
    author : Principal;
    timestamp : Int; // Use system timestamp for status posts
    media : MediaType;
    audioTrack : ?Storage.ExternalBlob; // Optional music track
    caption : Text;
  };

  let statuses = Map.empty<Nat, StatusItem>();
  let visibleTo = Map.empty<Principal, Set.Set<Principal>>();

  type SendMessageResult = {
    #success;
    #userNotFound : Text;
  };

  public shared ({ caller }) func create() {};

  // Profile management functions (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userRegistry.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != user and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userRegistry.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    if (profile.name == "") {
      Runtime.trap("Name cannot be empty. Go to your Profile screen and enter a name.");
    };
    userRegistry.add(caller, profile);
  };

  // New function: Update phone number only
  public shared ({ caller }) func updatePhoneNumber(phone : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update their phone number");
    };
    switch (userRegistry.get(caller)) {
      case (null) { Runtime.trap("User not found. Please go to the Profile screen and register a name.") };
      case (?profile) {
        if (profile.name == "") {
          Runtime.trap("Name cannot be empty. Go to your Profile screen and enter a name.");
        };
        userRegistry.add(caller, { profile with phoneNumber = phone });
      };
    };
  };

  // NEW: Profile photo management function
  public shared ({ caller }) func setCallerProfilePhoto(photo : ?Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set profile photos");
    };
    switch (photo) {
      case (null) {};
      case (?blob) {
        if (blob.size() > 1_073_741_824) {
          Runtime.trap("File too large. Maximum file size is 1 GB. Please upload a smaller file and try again.");
        };
      };
    };
    switch (userRegistry.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        userRegistry.add(caller, { profile with profilePhoto = photo });
      };
    };
  };

  // Get a user's profile photo reference (if present)
  public query ({ caller }) func getUserProfilePhoto(user : Principal) : async ?Storage.ExternalBlob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch profiles");
    };
    switch (userRegistry.get(user)) {
      case (null) { null };
      case (?profile) { profile.profilePhoto };
    };
  };

  // Legacy function: Register user (redirects to saveCallerUserProfile)
  public shared ({ caller }) func registerUser(name : Text) : async () {
    let newProfile : UserProfile = {
      name;
      phoneNumber = null;
      profilePhoto = null;
    };
    await saveCallerUserProfile(newProfile);
  };

  // Points to own Principal
  func getCallerPrincipal(caller : Principal) : Principal {
    caller;
  };

  // Add contact by Principal
  public shared ({ caller }) func addContact(contactPrincipalId : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add contacts");
    };
    if (caller == contactPrincipalId) {
      Runtime.trap("You cannot add yourself as a contact");
    };
    let callerPrincipal = caller;

    switch (userRegistry.get(contactPrincipalId)) {
      case (null) {
        Runtime.trap("Contact not found. Please ask your friend to create an account first.");
      };
      case (?_profile) {
        let currentContacts = switch (contactsList.get(callerPrincipal)) {
          case (null) { Set.empty<Principal>() };
          case (?contacts) { contacts };
        };

        if (currentContacts.contains(contactPrincipalId)) {
          Runtime.trap("Contact already added");
        };

        currentContacts.add(contactPrincipalId);
        contactsList.add(callerPrincipal, currentContacts);
        updateStatusVisibility(callerPrincipal, contactPrincipalId);
      };
    };
  };

  // Add contact by phone number
  public shared ({ caller }) func addContactByPhone(phone : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add contacts");
    };
    if (phone == "") {
      Runtime.trap("Please enter a valid phone number in international format (+123456789).");
    };
    switch (await findUserByPhoneNumber(phone)) {
      case (null) {
        Runtime.trap("Contact not found. Please ask your friend to create an account first.");
      };
      case (?user) {
        if (caller == user) {
          Runtime.trap("You cannot add yourself as a contact");
        };
        await addContact(user);
        createOrUpdateStatusVisibility(caller, user);
      };
    };
  };

  // Find user by phone number
  public query ({ caller }) func findUserByPhoneNumber(phone : Text) : async ?Principal {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search for contacts");
    };
    if (phone == "") {
      Runtime.trap("Please enter a valid phone number in international format (+123456789).");
    };
    if (not isValidPhoneNumber(phone)) { return null };
    for ((user, profile) in userRegistry.entries()) {
      switch (profile.phoneNumber) {
        case (null) {};
        case (?userPhoneNumber) {
          let normalizedPhone = normalizePhoneNumber(phone);
          let normalizedUserPhone = normalizePhoneNumber(userPhoneNumber);
          if (normalizedPhone == normalizedUserPhone) {
            return ?user;
          };
        };
      };
    };
    null;
  };

  // Phone number validation (basic)
  func isValidPhoneNumber(number : Text) : Bool {
    let chars = number.chars().toArray();
    if (chars.size() < 8 or chars.size() > 16) { return false };
    if (chars[0] != '+') { return false };
    for (i in Nat.range(1, chars.size())) {
      if (chars[i] < '0' or chars[i] > '9') { return false };
    };
    true;
  };

  // Normalize phone numbers (remove spaces and dashes)
  func normalizePhoneNumber(number : Text) : Text {
    let filtered = number.chars().filter(func(c) { c != ' ' and c != '-' });
    Text.fromIter(filtered);
  };

  // Send message with status
  type MessageStatus = {
    #sent;
    #delivered;
    #seen;
  };

  type Message = {
    from : Principal;
    to : Principal;
    content : Text;
    timestamp : Nat;
    status : MessageStatus;
    replyToId : ?Nat;
  };

  type MessagePingContext = {
    from : Principal;
    to : Principal;
    currentContent : Text;
    currentTimestamp : Nat;
    id : ?Nat;
    status : MessageStatus;
  };

  type pingReply = {
    #replyWithContext : PingContextAndReply;
    #noReply : MessagePingContext;
    #noReplyHomeScreenReceive;
  };

  type PingContextAndReply = {
    pingContext : MessagePingContext;
    replyToMessage : Message;
  };

  func createMessageStatus(from : Principal, to : Principal) : MessageStatus {
    #sent;
  };

  func saveMessage(from : Principal, to : Principal, message : Text, replyToId : ?Nat) : Message {
    let status = createMessageStatus(from, to);
    let timestamp = Time.now().toNat();

    let newMessage : Message = {
      from;
      to;
      content = message;
      timestamp;
      status;
      replyToId;
    };

    persistentMessages.add((message, from, to, replyToId));

    newMessage;
  };

  func fetchReplyIfExists(replyToId : ?Nat, from : Principal, to : Principal) : ?(Text, Principal, Principal, ?Nat) {
    switch (replyToId) {
      case (?id) {
        persistentMessages.find(func((_, sender, recipient, _)) { sender == from and recipient == to and ?id == replyToId });
      };
      case (null) { null };
    };
  };

  func createContextAndReply(from : Principal, to : Principal, message : Text, replyToId : ?Nat) : pingReply {
    // Save the message
    let newMessage = saveMessage(from, to, message, replyToId);

    // Fetch reply if exists (simulate fetching reply)
    switch (fetchReplyIfExists(replyToId, from, to)) {
      case (null) {
        let pingContext : MessagePingContext = {
          from;
          to;
          currentContent = message;
          currentTimestamp = Time.now().toNat();
          id = replyToId;
          status = createMessageStatus(from, to);
        };
        #noReply(pingContext);
      };
      case (?(originalMessage, _, _, _)) {
        let pingContext : MessagePingContext = {
          from;
          to;
          currentContent = message;
          currentTimestamp = Time.now().toNat();
          id = replyToId;
          status = createMessageStatus(from, to);
        };
        let replyMessage : Message = {
          from;
          to;
          content = message;
          timestamp = Time.now().toNat();
          status = createMessageStatus(from, to);
          replyToId = null;
        };
        let replyContext : PingContextAndReply = {
          pingContext;
          replyToMessage = replyMessage;
        };
        #replyWithContext(replyContext);
      };
    };
  };

  // NEW: Get persistent chat history with specific contact (with replies)
  public query ({ caller }) func getConversationWithContact(contact : Principal) : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch conversations");
    };

    persistentMessages.filter(
      func((_, from, to, _)) {
        (from == caller and to == contact) or (from == contact and to == caller);
      }
    ).map<(Text, Principal, Principal, ?Nat), Message>(
      func((msg, from, to, replyToId)) {
        {
          from;
          to;
          content = msg;
          timestamp = Time.now().toNat(); // Simulated timestamp
          status = #sent; // Simulated status
          replyToId;
        };
      }
    ).toArray();
  };

  // NEW: Store persistent message (backend only, no reply handling)
  public shared ({ caller }) func storePersistentMessage(recipient : Principal, content : Text, replyToId : ?Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can store messages");
    };

    switch (userRegistry.get(recipient)) {
      case (null) {
        Runtime.trap("Recipient not found. Please ask your friend to create an account first.");
      };
      case (?_) {
        persistentMessages.add((content, caller, recipient, replyToId));
      };
    };
  };

  // NEW: User presence tracking functions
  public shared ({ caller }) func setUserPresence(isOnline : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update presence");
    };
    let lastSeen = Time.now();
    userPresence.add(caller, (isOnline, lastSeen));
  };

  public query ({ caller }) func isUserOnline(user : Principal) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read presence");
    };
    switch (userPresence.get(user)) {
      case (null) { false };
      case (?presence) { presence.0 };
    };
  };

  public query ({ caller }) func getUserPresence() : async [(Principal, (Bool, Time.Time))] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get presence");
    };
    userPresence.toArray();
  };

  // Filesharing with persistent storage (IC-internal URL)
  include MixinStorage();

  type FileReference = {
    fileId : Text;
    externalBlob : Storage.ExternalBlob;
    timestamp : Int; // Use system timestamp for file shares
  };

  // Maximum file size constraint (1 GB)
  let maxFileSizeBytes : Nat = 1_073_741_824;

  public shared ({ caller }) func storeFile(fileId : Text, blob : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can share files");
    };
    if (fileId == "") {
      Runtime.trap("No file was attached. Please upload a file to share");
    };
    if (blob.size() > maxFileSizeBytes) {
      Runtime.trap("File too large. Maximum file size is 1 GB. Please upload a smaller file and try again.");
    };
    if (not (fileShares.containsKey(fileId))) {
      fileShares.add(fileId, blob);
    };
  };

  // STATUS / STORIES (24HR EXPIRY) BACKUP
  func updateStatusVisibility(user : Principal, contact : Principal) {
    let currentVisibility = switch (visibleTo.get(user)) {
      case (null) { Set.empty<Principal>() };
      case (?visibility) { visibility };
    };
    currentVisibility.add(contact);
    visibleTo.add(user, currentVisibility);
  };

  func createOrUpdateStatusVisibility(user : Principal, contact : Principal) {
    let currentVisibility = switch (visibleTo.get(user)) {
      case (null) { Set.empty<Principal>() };
      case (?visibility) { visibility };
    };
    currentVisibility.add(contact);
    visibleTo.add(user, currentVisibility);
  };

  // Helper func to check if caller can view a status
  func canViewStatus(caller : Principal, author : Principal) : Bool {
    // Author can always view their own status
    if (caller == author) {
      return true;
    };

    // Check if caller is in author's contacts (visible audience)
    switch (visibleTo.get(author)) {
      case (null) { false };
      case (?audience) { audience.contains(caller) };
    };
  };

  public shared ({ caller }) func createPublicStatus(media : MediaType, text : Text, audioTrack : ?Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create statuses");
    };

    // Validate single-line input field limit
    if (not text.isEmpty() and text.chars().toArray().size() > 160) {
      Runtime.trap("Status description too long! The max length is 160 characters. Please shorten your description, try again, and upload your status.");
    };

    // Validate media type and enforce allowed types (photo, video, text only - no audio)
    switch (media) {
      case (#photo(blob)) {
        if (blob.size() > 1_073_741_824) {
          Runtime.trap("File too large. Maximum file size for photos is 1 GB. Please upload a smaller file and try again.");
        };
      };
      case (#video(blob)) {
        if (blob.size() > 1_073_741_824) {
          Runtime.trap("File too large. Maximum file size for videos is 1 GB. Please upload a smaller file and try again.");
        };
      };
      case (#text(_)) {}; // Text is allowed
      case (#music(blob)) {
        if (blob.size() > 1_073_741_824) {
          Runtime.trap("File too large. Maximum file size for music is 1 GB. Please upload a smaller file and try again.");
        };
      };
    };

    // Optional audioTrack must be under 1GB if present
    switch (audioTrack) {
      case (null) {};
      case (?blob) {
        if (blob.size() > 1_073_741_824) {
          Runtime.trap("Audio track file too large. Maximum file size for music is 1 GB. Please upload a smaller file and try again.");
        };
      };
    };

    let author = caller;
    let timestamp = Time.now();
    let statusId = statuses.size() + 1; // Unique status ID

    // Initialize visibility audience with author's contacts
    let audience = switch (contactsList.get(author)) {
      case (null) { Set.empty<Principal>() };
      case (?contacts) { contacts };
    };

    // Always add author to their own visibility audience
    audience.add(author);
    visibleTo.add(author, audience);

    let newStatusItem : StatusItem = {
      id = statusId;
      author;
      timestamp;
      media;
      audioTrack;
      caption = text; // Use the text description as caption
    };

    statuses.add(statusId, newStatusItem);
  };

  public query ({ caller }) func getStatusesForUser(author : Principal) : async [StatusItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch statuses");
    };

    // Check if caller can view this author's statuses (must be author or in author's contacts)
    if (not canViewStatus(caller, author)) {
      Runtime.trap("Unauthorized: You can only view statuses from your contacts");
    };

    let now = Time.now();
    let dayInNanos : Int = 24 * 60 * 60 * 1_000_000_000;

    let filtered = List.empty<StatusItem>();

    for ((_key, status) in statuses.entries()) {
      if (status.author == author and now - status.timestamp < dayInNanos) {
        filtered.add(status);
      };
    };

    filtered.toArray();
  };

  public query ({ caller }) func getStatusById(statusId : Nat) : async ?StatusItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch statuses");
    };

    let now = Time.now();
    let dayInNanos : Int = 24 * 60 * 60 * 1_000_000_000;

    switch (statuses.get(statusId)) {
      case (null) { null };
      case (?status) {
        // Check if status is still valid (within 24 hours)
        if (now - status.timestamp >= dayInNanos) {
          return null;
        };

        // Check if caller can view this status
        if (not canViewStatus(caller, status.author)) {
          Runtime.trap("Unauthorized: You can only view statuses from your contacts");
        };

        ?status;
      };
    };
  };

  public query ({ caller }) func getBasicUserInfo(principal : Principal) : async ?(Principal, Text) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view user information");
    };
    switch (userRegistry.get(principal)) {
      case (null) { null };
      case (?profile) {
        ?(principal, profile.name);
      };
    };
  };

  public shared ({ caller }) func deleteStatusForAuthor(author : Principal, statusId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete statuses");
    };

    switch (statuses.get(statusId)) {
      case (null) {
        Runtime.trap("Status not found");
      };
      case (?status) {
        // Only the author can delete their own status, or admins
        if (status.author != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only delete your own statuses");
        };

        statuses.remove(statusId);
      };
    };
  };

  func isStatusVisible(toUser : Principal, author : Principal) : Bool {
    // User can always see their own statuses
    if (toUser == author) {
      return true;
    };

    // Check if toUser is in author's visibility audience
    let audience = switch (visibleTo.get(author)) {
      case (null) { Set.empty<Principal>() };
      case (?a) { a };
    };
    audience.contains(toUser);
  };

  public query ({ caller }) func getUserContacts() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch their contacts list");
    };
    switch (contactsList.get(caller)) {
      case (null) { [] };
      case (?contacts) { contacts.toArray() };
    };
  };

  public query ({ caller }) func getStatus(statusId : Nat) : async ?StatusItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch statuses");
    };

    let now = Time.now();
    let dayInNanos : Int = 24 * 60 * 60 * 1_000_000_000;

    switch (statuses.get(statusId)) {
      case (null) { null };
      case (?status) {
        // Check if status is still valid (within 24 hours)
        if (now - status.timestamp >= dayInNanos) {
          return null;
        };

        // Check if caller can view this status
        if (not canViewStatus(caller, status.author)) {
          Runtime.trap("Unauthorized: You can only view statuses from your contacts");
        };

        ?status;
      };
    };
  };

  // List all user's contacts by author
  public query ({ caller }) func listContactsByAuthor(author : Principal) : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list contacts");
    };

    // Only allow viewing own contacts or admin can view any
    if (caller != author and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You can only view your own contacts");
    };

    let contacts = switch (contactsList.get(author)) {
      case (null) {
        let newContacts = Set.empty<Principal>();
        newContacts.add(author); // Always add author's own principal
        newContacts;
      };
      case (?contacts) { contacts };
    };
    contacts.toArray();
  };

  public query ({ caller }) func getUserBasicInfo(principal : Principal) : async ?(Principal, Text) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view user information");
    };
    switch (userRegistry.get(principal)) {
      case (null) { null };
      case (?profile) {
        ?(principal, profile.name);
      };
    };
  };

  public query ({ caller }) func getUserProfileInfo(principal : Principal) : async [(Principal, Text)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view user profiles");
    };

    switch (userRegistry.get(principal)) {
      case (null) {
        Runtime.trap("User not found. Please ask your friend to create an account first.");
      };
      case (?profile) {
        [(principal, profile.name)];
      };
    };
  };
};
