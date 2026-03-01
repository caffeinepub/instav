import { useState } from 'react';
import { useGetAllPosts } from '../hooks/useQueries';
import PostCard from '../components/PostCard';
import StoriesRow from '../components/StoriesRow';
import TrendingProfilesSection from '../components/TrendingProfilesSection';
import { Skeleton } from '@/components/ui/skeleton';

function PostSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-3 flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="w-full aspect-square" />
      <div className="p-3 space-y-2">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { data: posts = [], isLoading } = useGetAllPosts();
  const [visibleCount, setVisibleCount] = useState(10);

  const sortedPosts = [...posts].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp)
  );

  const visiblePosts = sortedPosts.slice(0, visibleCount);

  return (
    <div className="max-w-lg mx-auto px-3 py-3">
      {/* Stories / Social Profiles Row */}
      <StoriesRow />

      {/* Trending Profiles */}
      <div className="mt-3">
        <TrendingProfilesSection />
      </div>

      {/* Posts Feed */}
      <div className="mt-3 space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
        ) : sortedPosts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">No posts yet</p>
            <p className="text-sm mt-1">Be the first to share something!</p>
          </div>
        ) : (
          <>
            {visiblePosts.map((post, index) => (
              <div
                key={String(post.id)}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <PostCard post={post} />
              </div>
            ))}
            {visibleCount < sortedPosts.length && (
              <button
                onClick={() => setVisibleCount(c => c + 10)}
                className="w-full py-3 text-sm text-primary font-medium hover:underline"
              >
                Load more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
