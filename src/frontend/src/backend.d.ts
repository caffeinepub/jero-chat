import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface StatusItem {
    id: bigint;
    media: MediaType;
    author: Principal;
    timestamp: bigint;
    caption: string;
    audioTrack?: ExternalBlob;
}
export interface Message {
    to: Principal;
    status: MessageStatus;
    content: string;
    from: Principal;
    timestamp: bigint;
    replyToId?: bigint;
}
export type MediaType = {
    __kind__: "music";
    music: ExternalBlob;
} | {
    __kind__: "video";
    video: ExternalBlob;
} | {
    __kind__: "text";
    text: string;
} | {
    __kind__: "photo";
    photo: ExternalBlob;
};
export interface UserProfile {
    name: string;
    profilePhoto?: ExternalBlob;
    phoneNumber?: string;
}
export enum MessageStatus {
    seen = "seen",
    sent = "sent",
    delivered = "delivered"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addContact(contactPrincipalId: Principal): Promise<void>;
    addContactByPhone(phone: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    create(): Promise<void>;
    createPublicStatus(media: MediaType, text: string, audioTrack: ExternalBlob | null): Promise<void>;
    deleteStatusForAuthor(author: Principal, statusId: bigint): Promise<void>;
    findUserByPhoneNumber(phone: string): Promise<Principal | null>;
    getBasicUserInfo(principal: Principal): Promise<[Principal, string] | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConversationWithContact(contact: Principal): Promise<Array<Message>>;
    getStatus(statusId: bigint): Promise<StatusItem | null>;
    getStatusById(statusId: bigint): Promise<StatusItem | null>;
    getStatusesForUser(author: Principal): Promise<Array<StatusItem>>;
    getUserBasicInfo(principal: Principal): Promise<[Principal, string] | null>;
    getUserContacts(): Promise<Array<Principal>>;
    getUserPresence(): Promise<Array<[Principal, [boolean, Time]]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserProfileInfo(principal: Principal): Promise<Array<[Principal, string]>>;
    getUserProfilePhoto(user: Principal): Promise<ExternalBlob | null>;
    isCallerAdmin(): Promise<boolean>;
    isUserOnline(user: Principal): Promise<boolean>;
    listContactsByAuthor(author: Principal): Promise<Array<Principal>>;
    registerUser(name: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setCallerProfilePhoto(photo: ExternalBlob | null): Promise<void>;
    setUserPresence(isOnline: boolean): Promise<void>;
    storeFile(fileId: string, blob: ExternalBlob): Promise<void>;
    storePersistentMessage(recipient: Principal, content: string, replyToId: bigint | null): Promise<void>;
    updatePhoneNumber(phone: string | null): Promise<void>;
}
