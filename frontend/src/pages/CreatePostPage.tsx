import React, { useState, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useCreatePost } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Image, Video, FileText, Upload, X, Loader2 } from 'lucide-react';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

type PostType = 'image' | 'video' | 'text';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();
  const createPost = useCreatePost();

  const [postType, setPostType] = useState<PostType>('text');
  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const authorName =
    profile?.name ||
    profile?.handle ||
    (identity ? identity.getPrincipal().toString().slice(0, 12) + '...' : 'Anonymous');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFile(file);
    setError('');

    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  const clearMedia = () => {
    setMediaFile(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!identity) {
      setError('You must be logged in to create a post.');
      return;
    }

    if (postType !== 'text' && !mediaFile) {
      setError('Please select a media file.');
      return;
    }

    if (!caption.trim() && postType === 'text') {
      setError('Please write something for your post.');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      let mediaBlob: ExternalBlob | undefined = undefined;

      if (mediaFile) {
        const arrayBuffer = await mediaFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        mediaBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
          setUploadProgress(pct);
        });
      }

      const mediaType = mediaFile
        ? mediaFile.type || (postType === 'video' ? 'video/mp4' : 'image/jpeg')
        : 'text';

      await createPost.mutateAsync({
        authorName,
        media: mediaBlob,
        mediaType,
        caption: caption.trim(),
      });

      toast.success('Post created successfully!');
      navigate({ to: '/profile' });
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to create post. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const canSubmit = (() => {
    if (isUploading || createPost.isPending) return false;
    if (postType === 'text') return caption.trim().length > 0;
    return !!mediaFile;
  })();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-display font-bold text-foreground">Create Post</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/' })}
            className="text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Post type selector */}
        <div className="flex gap-2 mb-6">
          {(['text', 'image', 'video'] as PostType[]).map((type) => {
            const icons = { text: FileText, image: Image, video: Video };
            const Icon = icons[type];
            const labels = { text: 'Text', image: 'Photo', video: 'Video' };
            return (
              <button
                key={type}
                onClick={() => {
                  setPostType(type);
                  clearMedia();
                  setError('');
                }}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border transition-all duration-200 ${
                  postType === type
                    ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                    : 'border-border bg-surface-1 text-muted-foreground hover:border-gold-500/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{labels[type]}</span>
              </button>
            );
          })}
        </div>

        {/* Media upload area */}
        {postType !== 'text' && (
          <div className="mb-5">
            <Label className="text-sm font-medium text-foreground mb-2 block">
              {postType === 'image' ? 'Photo' : 'Video'}
            </Label>
            {mediaPreview ? (
              <div className="relative rounded-xl overflow-hidden bg-surface-2">
                {postType === 'image' ? (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full max-h-64 object-cover"
                  />
                ) : (
                  <video
                    src={mediaPreview}
                    className="w-full max-h-64 object-cover"
                    controls
                  />
                )}
                <button
                  onClick={clearMedia}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                {isUploading && uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2">
                    <div className="w-full bg-white/20 rounded-full h-1.5">
                      <div
                        className="bg-gold-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-white text-xs mt-1 text-center">{uploadProgress}%</p>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 hover:border-gold-500/50 transition-colors bg-surface-1"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Tap to upload {postType === 'image' ? 'photo' : 'video'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {postType === 'image' ? 'JPG, PNG, GIF, WebP' : 'MP4, MOV, WebM'}
                  </p>
                </div>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={postType === 'image' ? 'image/*' : 'video/*'}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Caption */}
        <div className="mb-5">
          <Label htmlFor="caption" className="text-sm font-medium text-foreground mb-2 block">
            {postType === 'text' ? "What's on your mind?" : 'Caption'}
          </Label>
          <Textarea
            id="caption"
            placeholder={
              postType === 'text' ? 'Share your thoughts...' : 'Write a caption...'
            }
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="resize-none min-h-[100px]"
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {caption.length}/500
          </p>
        </div>

        {/* Author info */}
        <div className="mb-5 p-3 bg-surface-1 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground">Posting as</p>
          <p className="text-sm font-medium text-foreground">{authorName}</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full bg-gold-500 hover:bg-gold-400 text-background font-semibold rounded-xl py-3 shadow-gold-glow disabled:opacity-50"
        >
          {isUploading || createPost.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isUploading ? `Uploading… ${uploadProgress}%` : 'Creating post…'}
            </span>
          ) : (
            'Share Post'
          )}
        </Button>
      </div>
    </div>
  );
}
