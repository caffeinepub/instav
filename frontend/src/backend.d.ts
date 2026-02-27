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
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(postId: bigint, authorName: string, text: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createOrUpdateProfile(profileData: UserProfileData): Promise<void>;
    createPost(post: PostInput): Promise<bigint>;
    getAllPosts(): Promise<Array<Post>>;
    getCallerUserProfile(): Promise<UserProfileData | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComments(postId: bigint): Promise<Array<Comment>>;
    getPostsByUser(authorPrincipal: Principal): Promise<Array<Post>>;
    getProfileByHandle(handle: string): Promise<UserProfileData | null>;
    getProfileByPrincipal(principal: Principal): Promise<UserProfileData | null>;
    getUserProfile(principal: Principal): Promise<UserProfileData | null>;
    isCallerAdmin(): Promise<boolean>;
    likePost(postId: bigint): Promise<void>;
    recordView(postId: bigint): Promise<void>;
    saveCallerUserProfile(profileData: UserProfileData): Promise<void>;
    searchHandles(prefix: string): Promise<Array<string>>;
}
