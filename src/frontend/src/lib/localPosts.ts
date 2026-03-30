// ─── Local Post Store (IndexedDB-backed) ──────────────────────────────────────
// Persists posts in IndexedDB so they survive page reloads.
// IndexedDB supports hundreds of MB (vs localStorage's ~5MB limit).

const DB_NAME = "smileup_db";
const DB_VERSION = 3;
const POSTS_STORE = "posts";
const META_STORE = "meta"; // key-value store for following map, etc.
const COMMENTS_STORE = "comments";

const FOLLOWING_KEY = "smileup_following";

export interface StoredPost {
  id: string;
  authorPrincipal: string;
  authorName: string;
  mediaDataUrl: string | null; // base64 data URL for image/video preview
  mediaBlob?: Blob; // native Blob stored directly in IndexedDB
  mediaType: string; // "text", "image/jpeg", "video/mp4", etc.
  caption: string;
  timestamp: number; // Date.now()
  likeCount: number;
  viewCount: number;
  likedBy: string[]; // array of principal strings who liked
  destination?: "feed" | "shortsport";
}

export interface StoredComment {
  id: string;
  postId: string;
  authorPrincipal: string;
  authorName: string;
  text: string;
  timestamp: number; // Date.now() in ms
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
      if (!db.objectStoreNames.contains(COMMENTS_STORE)) {
        db.createObjectStore(COMMENTS_STORE, { keyPath: "id" });
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

// ─── Blob URL cache ───────────────────────────────────────────────────────────

const _blobUrlCache = new Map<string, string>();

/** Get a usable media URL for a post — uses cached blob URL or falls back to dataUrl */
export function getMediaUrl(post: StoredPost): string | null {
  if (post.mediaBlob) {
    const cached = _blobUrlCache.get(post.id);
    if (cached) return cached;
    const url = URL.createObjectURL(post.mediaBlob);
    _blobUrlCache.set(post.id, url);
    return url;
  }
  return post.mediaDataUrl ?? null;
}

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

/** Generate a unique ID based on timestamp + random */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Infer destination from post fields for backwards compatibility */
function inferDestination(p: StoredPost): "feed" | "shortsport" {
  if (p.destination) return p.destination;
  return p.mediaType?.startsWith("video") ? "shortsport" : "feed";
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getAllPostsAsync(): Promise<StoredPost[]> {
  const db = await openDB();
  const t = txn(db, POSTS_STORE, "readonly");
  const store = t.objectStore(POSTS_STORE);
  const posts = await idbGetAll<StoredPost>(store);
  return posts
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((p) => ({ ...p, destination: inferDestination(p) }));
}

export async function getPostAsync(
  id: string,
): Promise<StoredPost | undefined> {
  const db = await openDB();
  const t = txn(db, POSTS_STORE, "readonly");
  const store = t.objectStore(POSTS_STORE);
  const p = await idbGet<StoredPost>(store, id);
  if (!p) return undefined;
  return { ...p, destination: inferDestination(p) };
}

export async function createPostAsync(
  post: Omit<StoredPost, "id">,
): Promise<StoredPost> {
  const db = await openDB();
  const t = txn(db, POSTS_STORE, "readwrite");
  const store = t.objectStore(POSTS_STORE);
  const newPost: StoredPost = { ...post, id: generateId() };
  await idbPut(store, newPost);
  return newPost;
}

export async function updatePostAsync(
  id: string,
  updates: Partial<StoredPost>,
): Promise<StoredPost | undefined> {
  const db = await openDB();
  const t = txn(db, POSTS_STORE, "readwrite");
  const store = t.objectStore(POSTS_STORE);
  const existing = await idbGet<StoredPost>(store, id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates };
  await idbPut(store, updated);
  return updated;
}

export async function deletePostAsync(id: string): Promise<void> {
  const db = await openDB();
  const t = txn(db, POSTS_STORE, "readwrite");
  const store = t.objectStore(POSTS_STORE);
  await idbDelete(store, id);
}

// ─── Comment helpers ──────────────────────────────────────────────────────────

export async function getCommentsForPost(
  postId: string,
): Promise<StoredComment[]> {
  const db = await openDB();
  const t = txn(db, COMMENTS_STORE, "readonly");
  const store = t.objectStore(COMMENTS_STORE);
  const all = await idbGetAll<StoredComment>(store);
  return all
    .filter((c) => c.postId === postId)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function addComment(
  comment: Omit<StoredComment, "id">,
): Promise<StoredComment> {
  const db = await openDB();
  const t = txn(db, COMMENTS_STORE, "readwrite");
  const store = t.objectStore(COMMENTS_STORE);
  const newComment: StoredComment = { ...comment, id: generateId() };
  await idbPut(store, newComment);
  return newComment;
}

// ─── Following helpers ────────────────────────────────────────────────────────

export async function getFollowingMap(): Promise<Record<string, boolean>> {
  const db = await openDB();
  const t = txn(db, META_STORE, "readonly");
  const store = t.objectStore(META_STORE);
  const map = await idbGet<Record<string, boolean>>(store, FOLLOWING_KEY);
  return map ?? {};
}

export async function setFollowingMap(
  map: Record<string, boolean>,
): Promise<void> {
  const db = await openDB();
  const t = txn(db, META_STORE, "readwrite");
  const store = t.objectStore(META_STORE);
  await idbPut(store, map, FOLLOWING_KEY);
}

export async function followUser(principal: string): Promise<void> {
  const map = await getFollowingMap();
  map[principal] = true;
  await setFollowingMap(map);
}

export async function unfollowUser(principal: string): Promise<void> {
  const map = await getFollowingMap();
  delete map[principal];
  await setFollowingMap(map);
}

export async function isFollowing(principal: string): Promise<boolean> {
  const map = await getFollowingMap();
  return !!map[principal];
}

// ─── User name cache ──────────────────────────────────────────────────────────

const USER_NAME_KEY = "smileup_usernames";

export function getUserName(principal: string): string | null {
  try {
    const raw = localStorage.getItem(USER_NAME_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[principal] ?? null;
  } catch {
    return null;
  }
}

export function setUserName(principal: string, name: string): void {
  try {
    const raw = localStorage.getItem(USER_NAME_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[principal] = name;
    localStorage.setItem(USER_NAME_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

// ─── Visit tracking ───────────────────────────────────────────────────────────

const VISITED_KEY = "smileup_visited";
const MAX_VISITED = 2;

export function getRecentlyVisited(): string[] {
  try {
    const raw = localStorage.getItem(VISITED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function recordVisit(principal: string): void {
  try {
    const visited = getRecentlyVisited().filter((p) => p !== principal);
    visited.unshift(principal);
    localStorage.setItem(
      VISITED_KEY,
      JSON.stringify(visited.slice(0, MAX_VISITED)),
    );
  } catch {
    // ignore
  }
}
