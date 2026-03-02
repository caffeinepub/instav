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
export type UserIdentifier = {
    __kind__: "principal";
    principal: Principal;
} | {
    __kind__: "handle";
    handle: string;
};
export interface UserProfileInput {
    bio: string;
    username: string;
    name: string;
    profilePhoto?: ExternalBlob;
    bannerImage?: ExternalBlob;
    handle: string;
    location: string;
}
export interface UserProfile {
    bio: string;
    username: string;
    name: string;
    profilePhoto?: ExternalBlob;
    bannerImage?: ExternalBlob;
    handle: string;
    location: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteHandle(handle: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyProfile(): Promise<UserProfileInput>;
    getProfile(identifier: UserIdentifier): Promise<UserProfileInput | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    lookupHandle(principal: Principal): Promise<string | null>;
    lookupPrincipal(handle: string): Promise<Principal | null>;
    registerHandle(handle: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfileInput): Promise<void>;
    updateProfile(newProfileData: UserProfileInput): Promise<void>;
}
