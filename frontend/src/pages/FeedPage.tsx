import React, { useState } from 'react';
import { Loader2, Rss } from 'lucide-react';
import type { Post } from '../backend';
import { useGetAllPosts } from '../hooks/useQueries';
import PostCard from '../components/PostCard';
import CommentsSheet from '../components/CommentsSheet';

export default function FeedPage() {
  const { data: posts, isLoading, error } = useGetAllPosts();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const handleCommentClick = (post: Post) => {
    setSelectedPost(post);
    setCommentsOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Feed header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <Rss className="w-5 h-5 text-primary" />
          <h1 className="font-bold text-lg text-foreground">Feed</h1>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading posts...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-destructive text-sm">Failed to load posts. Please try again.</p>
          </div>
        )}

        {!isLoading && !error && posts && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Rss className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground mb-1">No posts yet</h3>
              <p className="text-muted-foreground text-sm">Be the first to share something!</p>
            </div>
          </div>
        )}

        {posts && posts.map((post) => (
          <PostCard
            key={post.id.toString()}
            post={post}
            onCommentClick={handleCommentClick}
          />
        ))}
      </main>

      <CommentsSheet
        post={selectedPost}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
      />
    </div>
  );
}
