// ─── Local Post Store (IndexedDB-backed) ──────────────────────────────────────
// Persists posts in IndexedDB so they survive page reloads.
// IndexedDB supports hundreds of MB (vs localStorage's ~5MB limit).

const DB_NAME = "smileup_db";
const DB_VERSION = 2;
const POSTS_STORE = "posts";
const META_STORE = "meta"; // key-value store for following map, etc.

const FOLLOWING_KEY = "smileup_following";

export interface StoredPost {
  id: string;
  authorPrincipal: string;
  authorName: string;
  mediaDataUrl: string | null; // base64 data URL for image/video preview
  mediaType: string; // "text", "image/jpeg", "video/mp4", etc.
  caption: string;
  timestamp: number; // Date.now()
  likeCount: number;
  viewCount: number;
  likedBy: string[]; // array of principal strings who liked
}

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(POSTS_STORE)) {
        db.createObjectStore(POSTS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    };
    req.onsuccess = (e) => {
      _db = (e.target as IDBOpenDBRequest).result;
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
  });
}

function txn(
  db: IDBDatabase,
  stores: string | string[],
  mode: IDBTransactionMode,
): IDBTransaction {
  return db.transaction(stores, mode);
}

function idbGet<T>(
  store: IDBObjectStore,
  key: IDBValidKey,
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const r = store.get(key);
    r.onsuccess = () => resolve(r.result as T | undefined);
    r.onerror = () => reject(r.error);
  });
}

function idbGetAll<T>(store: IDBObjectStore): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const r = store.getAll();
    r.onsuccess = () => resolve(r.result as T[]);
    r.onerror = () => reject(r.error);
  });
}

function idbPut(
  store: IDBObjectStore,
  value: unknown,
  key?: IDBValidKey,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const r = key !== undefined ? store.put(value, key) : store.put(value);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}

function idbDelete(store: IDBObjectStore, key: IDBValidKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const r = store.delete(key);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}

// ─── Migration: move localStorage posts to IndexedDB ─────────────────────────

async function migrateFromLocalStorage(): Promise<void> {
  try {
    const raw = localStorage.getItem("smileup_posts");
    if (!raw) return;
    const posts = JSON.parse(raw) as StoredPost[];
    if (!posts.length) return;
    const db = await openDB();
    const t = txn(db, POSTS_STORE, "readwrite");
    const store = t.objectStore(POSTS_STORE);
    await Promise.all(posts.map((p) => idbPut(store, p)));
    localStorage.removeItem("smileup_posts");
  } catch {
    // Ignore migration errors
  }
}

// Run migration once
migrateFromLocalStorage();

// ─── Post helpers ─────────────────────────────────────────────────────────────

/** Convert a File to a base64 data URL */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Generate a unique ID based on timestamp + random suffix */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Public API (async) ────────────────────────────────────────────────────────

export async function getAllPostsAsync(): Promise<StoredPost[]> {
  const db = await openDB();
  const t = txn(db, POSTS_STORE, "readonly");
  const store = t.objectStore(POSTS_STORE);
  const posts = await idbGetAll<StoredPost>(store);
  return posts.sort((a, b) => b.timestamp - a.timestamp);
}

export async function getPostsByUserAsync(
  principalStr: string,
): Promise<StoredPost[]> {
  const all = await getAllPostsAsync();
  return all.filter((p) => p.authorPrincipal === principalStr);
}

export async function createPostAsync(
  post: Omit<StoredPost, "id">,
): Promise<StoredPost> {
  const newPost: StoredPost = { ...post, id: generateId() };
  const db = await openDB();
  const t = txn(db, POSTS_STORE, "readwrite");
  const store = t.objectStore(POSTS_STORE);
  await idbPut(store, newPost);
  return newPost;
}

export async function likePostAsync(
  postId: string,
  principalStr: string,
): Promise<void> {
  const db = await openDB();
  const t = txn(db, POSTS_STORE, "readwrite");
  const store = t.objectStore(POSTS_STORE);
  const post = await idbGet<StoredPost>(store, postId);
  if (!post) return;
  if (!post.likedBy.includes(principalStr)) {
    post.likedBy = [...post.likedBy, principalStr];
    post.likeCount = post.likedBy.length;
    await idbPut(store, post);
  }
}

export async function unlikePostAsync(
  postId: string,
  principalStr: string,
): Promise<void> {
  const db = await openDB();
  const t = txn(db, POSTS_STORE, "readwrite");
  const store = t.objectStore(POSTS_STORE);
  const post = await idbGet<StoredPost>(store, postId);
  if (!post) return;
  post.likedBy = post.likedBy.filter((p) => p !== principalStr);
  post.likeCount = post.likedBy.length;
  await idbPut(store, post);
}

export async function getLikedPostIdsAsync(
  principalStr: string,
): Promise<string[]> {
  const all = await getAllPostsAsync();
  return all.filter((p) => p.likedBy.includes(principalStr)).map((p) => p.id);
}

export async function deletePostAsync(postId: string): Promise<void> {
  const db = await openDB();
  const t = txn(db, POSTS_STORE, "readwrite");
  const store = t.objectStore(POSTS_STORE);
  await idbDelete(store, postId);
}

// ─── Following helpers (still uses localStorage for small data) ───────────────

function readFollowingMap(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(FOLLOWING_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    return {};
  }
}

function writeFollowingMap(map: Record<string, string[]>): void {
  localStorage.setItem(FOLLOWING_KEY, JSON.stringify(map));
}

/** Returns the list of principals that `followerPrincipal` is following */
export function getFollowing(followerPrincipal: string): string[] {
  const map = readFollowingMap();
  return map[followerPrincipal] ?? [];
}

export function followUser(
  followerPrincipal: string,
  targetPrincipal: string,
): void {
  const map = readFollowingMap();
  const current = map[followerPrincipal] ?? [];
  if (!current.includes(targetPrincipal)) {
    map[followerPrincipal] = [...current, targetPrincipal];
    writeFollowingMap(map);
  }
}

export function unfollowUser(
  followerPrincipal: string,
  targetPrincipal: string,
): void {
  const map = readFollowingMap();
  const current = map[followerPrincipal] ?? [];
  map[followerPrincipal] = current.filter((p) => p !== targetPrincipal);
  writeFollowingMap(map);
}

/** How many users (from the following map) follow `targetPrincipal` */
export function getFollowerCount(targetPrincipal: string): number {
  const map = readFollowingMap();
  let count = 0;
  for (const followers of Object.values(map)) {
    if (followers.includes(targetPrincipal)) count++;
  }
  return count;
}

/** Top N users by follower count */
export function getTopCreatorPrincipals(
  limit: number,
): Array<{ principal: string; followerCount: number }> {
  const map = readFollowingMap();
  const counts: Record<string, number> = {};

  for (const followers of Object.values(map)) {
    for (const f of followers) {
      counts[f] = (counts[f] ?? 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([principal, followerCount]) => ({ principal, followerCount }))
    .sort((a, b) => b.followerCount - a.followerCount)
    .slice(0, limit);
}

// ─── Legacy sync API (kept for backward compatibility, now async underneath) ──
// These are used by existing code. They return empty/default values synchronously
// and trigger async reads. Use the Async versions in new code.

export function getAllPosts(): StoredPost[] {
  // Sync fallback - returns empty, actual data comes from async hook
  return [];
}

export function getPostsByUser(_principalStr: string): StoredPost[] {
  return [];
}

export function createPost(post: Omit<StoredPost, "id">): StoredPost {
  // Fire-and-forget async create
  createPostAsync(post);
  return { ...post, id: generateId() };
}

export function likePost(postId: string, principalStr: string): void {
  likePostAsync(postId, principalStr);
}

export function unlikePost(postId: string, principalStr: string): void {
  unlikePostAsync(postId, principalStr);
}

export function getLikedPostIds(_principalStr: string): string[] {
  return [];
}

export function deletePost(postId: string): void {
  deletePostAsync(postId);
}
