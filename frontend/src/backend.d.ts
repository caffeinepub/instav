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
export interface Comment {
    id: bigint;
    text: string;
    authorName: string;
    timestamp: bigint;
    authorPrincipal: Principal;
    postId: bigint;
}
export type UserIdentifier = {
    __kind__: "principal";
    principal: Principal;
} | {
    __kind__: "handle";
    handle: string;
};
export interface UserProfileSummary {
    bio: string;
    postCount: bigint;
    principal: Principal;
    displayName: string;
    avatarUrl?: ExternalBlob;
    followerCount: bigint;
    handle: string;
    followingCount: bigint;
}
export interface FriendRequest {
    status: FriendRequestStatus;
    recipient: Principal;
    sender: Principal;
    timestamp: bigint;
}
export interface CreatorRanking {
    principal: Principal;
    username: string;
    profilePicBlob?: ExternalBlob;
    followerCount: bigint;
}
export interface Post {
    id: bigint;
    media?: ExternalBlob;
    likeCount: bigint;
    authorName: string;
    viewCount: bigint;
    timestamp: bigint;
    caption: string;
    mediaType: string;
    authorPrincipal: Principal;
}
export interface Notification {
    id: bigint;
    notificationType: NotificationType;
    read: boolean;
    fromPrincipal: Principal;
    timestamp: bigint;
    postId?: bigint;
}
export interface Message {
    content: string;
    read: boolean;
    recipient: Principal;
    sender: Principal;
    timestamp: bigint;
    postId?: bigint;
}
export interface UserProfileData {
    bio: string;
    displayName: string;
    handle: string;
    profilePicture?: ExternalBlob;
}
export interface PostInput {
    media?: ExternalBlob;
    authorName: string;
    caption: string;
    mediaType: string;
}
export interface Conversation {
    participants: [Principal, Principal];
    lastUpdated: bigint;
}
export enum FriendRequestStatus {
    pending = "pending",
    accepted = "accepted",
    declined = "declined"
}
export enum FriendshipStatusEnum {
    notConnected = "notConnected",
    pendingOutgoing = "pendingOutgoing",
    friends = "friends",
    pendingIncoming = "pendingIncoming"
}
export enum NotificationType {
    comment = "comment",
    message = "message",
    new_shadow = "new_shadow"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(postId: bigint, authorName: string, text: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelFriendRequest(receiver: Principal): Promise<void>;
    createOrUpdateProfile(profileData: UserProfileData): Promise<void>;
    createPost(post: PostInput): Promise<bigint>;
    followUser(target: Principal): Promise<void>;
    getAllPosts(): Promise<Array<Post>>;
    getCallerUserProfile(): Promise<UserProfileData | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComments(postId: bigint): Promise<Array<Comment>>;
    getConversations(): Promise<Array<Conversation>>;
    getFollowers(user: Principal): Promise<Array<Principal>>;
    getFollowing(user: Principal): Promise<Array<Principal>>;
    getFriendsList(): Promise<Array<Principal>>;
    getFriendshipStatus(otherPrincipal: Principal): Promise<FriendshipStatusEnum>;
    getIncomingFriendRequests(): Promise<Array<FriendRequest>>;
    getMessages(otherParticipant: Principal): Promise<Array<Message>>;
    getNotifications(): Promise<Array<Notification>>;
    getOutgoingFriendRequests(): Promise<Array<FriendRequest>>;
    getPostsByUser(authorPrincipal: Principal): Promise<Array<Post>>;
    getProfileByHandle(handle: string): Promise<UserProfileData | null>;
    getProfileByPrincipal(principal: Principal): Promise<UserProfileData | null>;
    getTopCreatorsByShadows(limit: bigint): Promise<Array<CreatorRanking>>;
    getUserProfile(identifier: UserIdentifier): Promise<UserProfileData | null>;
    isCallerAdmin(): Promise<boolean>;
    isFollowing(target: Principal): Promise<boolean>;
    likePost(postId: bigint): Promise<void>;
    markMessagesRead(otherParticipant: Principal): Promise<void>;
    markNotificationRead(notificationId: bigint): Promise<void>;
    recordView(postId: bigint): Promise<void>;
    respondToFriendRequest(sender: Principal, accept: boolean): Promise<void>;
    saveCallerUserProfile(profileData: UserProfileData): Promise<void>;
    searchHandles(prefix: string): Promise<Array<string>>;
    searchUsers(searchStr: string): Promise<Array<UserProfileSummary>>;
    sendFriendRequest(receiver: Principal): Promise<void>;
    sendMessage(recipient: Principal, content: string, postId: bigint | null): Promise<void>;
    unfollowUser(target: Principal): Promise<void>;
    unfriend(friendPrincipal: Principal): Promise<void>;
}
