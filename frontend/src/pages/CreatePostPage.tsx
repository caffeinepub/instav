import React, { useState, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Upload, Link, Image, Video, FileImage, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ExternalBlob } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCreatePost, useGetCallerUserProfile } from '../hooks/useQueries';

type MediaType = 'photo' | 'video' | 'GIF' | 'poster';

const mediaTypeOptions: { value: MediaType; label: string; icon: React.ReactNode }[] = [
  { value: 'photo', label: 'Photo', icon: <Image className="w-4 h-4" /> },
  { value: 'video', label: 'Video', icon: <Video className="w-4 h-4" /> },
  { value: 'GIF', label: 'GIF', icon: <FileImage className="w-4 h-4" /> },
  { value: 'poster', label: 'Poster', icon: <Image className="w-4 h-4" /> },
];

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const createPost = useCreatePost();

  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaBlob, setMediaBlob] = useState<ExternalBlob | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('photo');
  const [caption, setCaption] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Detect media type from file
    if (file.type.startsWith('video/')) setMediaType('video');
    else if (file.type === 'image/gif') setMediaType('GIF');
    else setMediaType('photo');

    // Create a local object URL for preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setMediaUrl(''); // clear URL input

    try {
      setIsUploading(true);
      setUploadProgress(0);
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });
      setMediaBlob(blob);
      setUploadProgress(100);
      toast.success('File ready to post!');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to process file. Try using a URL instead.');
      setUploadProgress(null);
      setPreviewUrl('');
      setMediaBlob(null);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity) {
      toast.error('Please sign in to create a post');
      return;
    }

    // Must have either a blob (file upload) or a URL
    const hasMedia = mediaBlob !== null || mediaUrl.trim() !== '';
    if (!hasMedia) {
      toast.error('Please provide a media URL or upload a file');
      return;
    }

    const authorName = userProfile?.displayName || 'Anonymous';

    // Build the media ExternalBlob: prefer uploaded blob, fall back to URL
    const media: ExternalBlob | undefined = mediaBlob
      ? mediaBlob
      : mediaUrl.trim()
      ? ExternalBlob.fromURL(mediaUrl.trim())
      : undefined;

    createPost.mutate(
      { authorName, media, mediaType, caption },
      {
        onSuccess: () => {
          toast.success('Post created!');
          // Clean up preview URL
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          navigate({ to: '/' });
        },
        onError: (err) => {
          toast.error('Failed to create post. Please try again.');
          console.error(err);
        },
      }
    );
  };

  // Determine what to show in preview
  const displayPreview = previewUrl || mediaUrl;

  if (!identity) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 pb-24">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Sign in to post</h2>
        <p className="text-muted-foreground text-sm text-center">
          You need to be signed in to share photos, videos, and more.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="font-bold text-lg text-foreground">New Post</h1>
          <Button
            onClick={handleSubmit}
            disabled={createPost.isPending || isUploading || (!mediaBlob && !mediaUrl.trim())}
            size="sm"
            className="rounded-full"
          >
            {createPost.isPending ? (
              <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Posting...</>
            ) : 'Share'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Media Type Selector */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Media Type</label>
          <div className="grid grid-cols-4 gap-2">
            {mediaTypeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMediaType(opt.value)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all text-xs font-medium ${
                  mediaType === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Media URL */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <Link className="w-4 h-4 inline mr-1" />
            Media URL
          </label>
          <input
            type="url"
            value={mediaUrl}
            onChange={(e) => {
              setMediaUrl(e.target.value);
              // Clear file blob if user types a URL
              if (e.target.value) {
                setMediaBlob(null);
                setPreviewUrl('');
                setUploadProgress(null);
              }
            }}
            placeholder="https://example.com/image.jpg"
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <Upload className="w-4 h-4 inline mr-1" />
            Or Upload File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full border-2 border-dashed border-border rounded-xl py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
            <span className="text-sm">
              {isUploading ? 'Processing...' : 'Click to upload photo or video'}
            </span>
            <span className="text-xs opacity-60">JPG, PNG, GIF, MP4, etc.</span>
          </button>

          {uploadProgress !== null && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>{uploadProgress < 100 ? 'Processing...' : 'Ready!'}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              {uploadProgress === 100 && (
                <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
                  <CheckCircle className="w-3 h-3" />
                  File ready — click Share to post
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview */}
        {displayPreview && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Preview</label>
            <div className="rounded-xl overflow-hidden bg-black max-h-64 flex items-center justify-center">
              {mediaType === 'video' ? (
                <video src={displayPreview} controls className="max-h-64 w-full object-contain" />
              ) : (
                <img src={displayPreview} alt="Preview" className="max-h-64 w-full object-contain" />
              )}
            </div>
          </div>
        )}

        {/* Caption */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            rows={3}
            maxLength={500}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground resize-none"
          />
          <p className="text-xs text-muted-foreground text-right mt-1">{caption.length}/500</p>
        </div>
      </form>
    </div>
  );
}
