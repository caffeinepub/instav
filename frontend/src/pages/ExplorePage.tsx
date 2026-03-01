import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Loader2, Users, AtSign, Heart, Eye, UserCheck } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useGetAllPosts, useSearchUsers } from '../hooks/useQueries';
import type { Post } from '../backend';
import AvatarPlaceholder from '../components/AvatarPlaceholder';

// Local type for user search results (UserProfileSummary is not in the backend interface)
interface UserSearchResult {
  handle: string;
  profile: {
    displayName: string;
    handle: string;
    bio: string;
    profilePicture?: import('../backend').ExternalBlob;
  };
}

export default function ExplorePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'posts' | 'users'>('posts');
  const { data: posts, isLoading: postsLoading } = useGetAllPosts();

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use the searchUsers hook for fuzzy + exact search
  const { data: userResults, isLoading: usersLoading } = useSearchUsers(
    activeTab === 'users' ? debouncedQuery : ''
  );

  const filteredPosts =
    posts?.filter((post) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        post.caption.toLowerCase().includes(q) ||
        post.authorName.toLowerCase().includes(q) ||
        post.mediaType.toLowerCase().includes(q)
      );
    }) ?? [];

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sticky header with search + tabs */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 space-y-3">
        <div className="max-w-lg mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'users'
                  ? 'Search by name or handle...'
                  : 'Search posts, users...'
              }
              className="w-full bg-muted rounded-full pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-lg mx-auto flex gap-1">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'posts'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Posts
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Users
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {activeTab === 'users' ? (
          <UserSearchResults
            query={debouncedQuery}
            users={userResults ?? []}
            isLoading={usersLoading}
            onNavigate={(handle) =>
              navigate({ to: '/profile/$handle', params: { handle } })
            }
          />
        ) : (
          <>
            {!isSearching && (
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-foreground text-sm">All Posts</h2>
              </div>
            )}

            {postsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  {isSearching ? 'No results found' : 'No posts yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {filteredPosts.map((post) => (
                  <PostThumbnail key={post.id.toString()} post={post} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── User Search Results ──────────────────────────────────────────────────────

function UserSearchResults({
  query,
  users,
  isLoading,
  onNavigate,
}: {
  query: string;
  users: UserSearchResult[];
  isLoading: boolean;
  onNavigate: (handle: string) => void;
}) {
  if (!query.trim()) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <AtSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm font-medium">Find people on Smileup</p>
        <p className="text-xs mt-1 opacity-70">Search by name or @handle</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm font-medium">No users found</p>
        <p className="text-xs mt-1 opacity-70">
          No results for &ldquo;{query}&rdquo;
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">
        {users.length} result{users.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
      </p>
      {users.map((user) => (
        <UserResultCard
          key={user.handle}
          user={user}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

function UserResultCard({
  user,
  onNavigate,
}: {
  user: UserSearchResult;
  onNavigate: (handle: string) => void;
}) {
  return (
    <button
      onClick={() => onNavigate(user.handle)}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors text-left"
    >
      <AvatarPlaceholder
        name={user.profile.displayName || user.handle}
        profilePicture={user.profile.profilePicture}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">
          {user.profile.displayName || user.handle}
        </p>
        <p className="text-xs text-primary truncate">@{user.handle}</p>
        {user.profile.bio && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{user.profile.bio}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <UserCheck className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}

// ── Post Thumbnail ───────────────────────────────────────────────────────────

function PostThumbnail({ post }: { post: Post }) {
  const mediaUrl = post.media?.getDirectURL();

  return (
    <div className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
      {post.mediaType === 'video' ? (
        <div className="w-full h-full flex items-center justify-center bg-black/80">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-0.5" />
          </div>
        </div>
      ) : mediaUrl ? (
        <img
          src={mediaUrl}
          alt={post.caption || 'Post'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <span className="text-xs text-muted-foreground">No image</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        <div className="flex items-center gap-1 text-white text-xs">
          <Heart className="w-3 h-3" />
          {Number(post.likeCount)}
        </div>
        <div className="flex items-center gap-1 text-white text-xs">
          <Eye className="w-3 h-3" />
          {Number(post.viewCount)}
        </div>
      </div>
    </div>
  );
}
