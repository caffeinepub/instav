import { useEffect, useRef } from 'react';
import { Eye, PlusCircle } from 'lucide-react';

interface YourStoryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onViewMyPosts: () => void;
  onCreateNewPost: () => void;
}

export default function YourStoryPopup({
  isOpen,
  onClose,
  onViewMyPosts,
  onCreateNewPost,
}: YourStoryPopupProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-2 w-44 bg-card border border-border rounded-xl shadow-card z-50 overflow-hidden"
    >
      <button
        onClick={onViewMyPosts}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors"
      >
        <Eye size={16} className="text-primary flex-shrink-0" />
        View My Posts
      </button>
      <div className="h-px bg-border" />
      <button
        onClick={onCreateNewPost}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors"
      >
        <PlusCircle size={16} className="text-accent flex-shrink-0" />
        Create New Post
      </button>
    </div>
  );
}
