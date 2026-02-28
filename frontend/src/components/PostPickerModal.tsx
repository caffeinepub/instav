import React from 'react';
import { useGetPostsByUser } from '../hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Film, ImageIcon } from 'lucide-react';
import type { Post } from '../backend';

interface PostPickerModalProps {
  myPrincipal: string;
  onSelect: (postId: bigint) => void;
  onClose: () => void;
}

function PostThumbnail({ post }: { post: Post }) {
  const isVideo = post.mediaType === 'video';
  const mediaUrl = post.media?.getDirectURL();

  return (
    <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
      {mediaUrl ? (
        isVideo ? (
          <video
            src={mediaUrl}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
          />
        ) : (
          <img src={mediaUrl} alt={post.caption} className="w-full h-full object-cover" />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          {isVideo ? <Film size={24} /> : <ImageIcon size={24} />}
        </div>
      )}
      {isVideo && (
        <div className="absolute top-1 right-1 bg-black/60 rounded p-0.5">
          <Film size={10} className="text-white" />
        </div>
      )}
    </div>
  );
}

export default function PostPickerModal({ myPrincipal, onSelect, onClose }: PostPickerModalProps) {
  const { data: posts, isLoading } = useGetPostsByUser(myPrincipal);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm w-full">
        <DialogHeader>
          <DialogTitle>Share a Shortspot</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-2 p-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 p-1">
              {posts.map((post) => (
                <button
                  key={post.id.toString()}
                  onClick={() => onSelect(post.id)}
                  className="group relative rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                  title={post.caption}
                >
                  <PostThumbnail post={post} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  {post.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                      <p className="text-white text-xs truncate">{post.caption}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Film size={32} className="mb-2 opacity-40" />
              <p className="text-sm">No posts to share yet.</p>
              <p className="text-xs mt-1">Create a post first!</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
