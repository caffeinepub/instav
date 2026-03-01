import React, { useState } from 'react';
import { Loader2, Sparkles, Flame } from 'lucide-react';
import type { Post } from '../backend';
import { useGetAllPosts } from '../hooks/useQueries';
import PostCard from '../components/PostCard';
import CommentsSheet from '../components/CommentsSheet';
import StoriesRow from '../components/StoriesRow';
import TrendingProfilesSection from '../components/TrendingProfilesSection';

export default function FeedPage() {
  const { data: posts, isLoading, error } = useGetAllPosts();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const handleCommentClick = (post: Post) => {
    setSelectedPost(post);
    setCommentsOpen(true);
  };

  const sortedPosts = posts
    ? [...posts].sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    : [];

  return (
    <div className="min-h-screen pb-28" style={{ background: 'oklch(0.08 0.008 260)' }}>

      {/* Hero gradient accent at top */}
      <div
        className="absolute top-14 left-0 right-0 h-64 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.78 0.16 75 / 8%) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />

      <div className="relative z-10">
        {/* ── Stories Row ── */}
        <div className="pt-3 pb-1">
          <StoriesRow />
        </div>

        {/* ── Divider ── */}
        <div className="mx-4 h-px bg-white/5 my-2" />

        {/* ── Trending Profiles ── */}
        <div className="py-3">
          <TrendingProfilesSection />
        </div>

        {/* ── Divider ── */}
        <div className="mx-4 h-px bg-white/5 my-2" />

        {/* ── Feed Header ── */}
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="w-7 h-7 rounded-lg bg-coral/15 flex items-center justify-center">
            <Flame className="w-4 h-4 text-coral" />
          </div>
          <h2 className="font-display font-bold text-base text-foreground tracking-tight">
            Latest Posts
          </h2>
          {!isLoading && sortedPosts.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground font-medium">
              {sortedPosts.length} post{sortedPosts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ── Feed Content ── */}
        <main className="max-w-lg mx-auto px-4 space-y-4 pb-4">

          {/* Loading skeleton */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card rounded-2xl overflow-hidden shadow-card">
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-10 h-10 rounded-full shimmer" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 rounded-full shimmer w-32" />
                      <div className="h-2.5 rounded-full shimmer w-20" />
                    </div>
                  </div>
                  <div className="h-64 shimmer" />
                  <div className="px-4 py-3 space-y-2">
                    <div className="h-3 rounded-full shimmer w-3/4" />
                    <div className="h-3 rounded-full shimmer w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-coral/10 flex items-center justify-center">
                <Flame className="w-6 h-6 text-coral" />
              </div>
              <p className="text-muted-foreground text-sm text-center">
                Failed to load posts. Please try again.
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && sortedPosts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gold/10 flex items-center justify-center shadow-gold-glow">
                  <Sparkles className="w-10 h-10 text-gold" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-coral flex items-center justify-center pulse-glow">
                  <span className="text-white text-[10px] font-bold">0</span>
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-display font-bold text-lg text-foreground mb-1">
                  No posts yet
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Be the first to share something amazing with the community!
                </p>
              </div>
            </div>
          )}

          {/* Posts */}
          {sortedPosts.map((post, index) => (
            <div
              key={post.id.toString()}
              style={{ animationDelay: `${index * 60}ms` }}
              className="fade-in-up"
            >
              <PostCard
                post={post}
                onCommentClick={handleCommentClick}
              />
            </div>
          ))}
        </main>
      </div>

      <CommentsSheet
        post={selectedPost}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
      />
    </div>
  );
}
