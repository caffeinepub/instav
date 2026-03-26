import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  FileText,
  Image,
  Layers,
  Loader2,
  Smile,
  Upload,
  Video,
  X,
} from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCreatePost, useGetCallerUserProfile } from "../hooks/useQueries";
import * as localPosts from "../lib/localPosts";

type PostType = "image" | "video" | "text" | "gif" | "poster";

/** Returns true if the string looks like a principal ID (e.g. "f6tf6-qg...") */
function isPrincipalFormat(s: string | null | undefined): boolean {
  return !s || /^[a-z0-9]{5,}-[a-z0-9]/.test(s);
}

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();
  const createPost = useCreatePost();

  const [postType, setPostType] = useState<PostType>("text");
  const [caption, setCaption] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const localName = identity
    ? localPosts.getUserName(identity.getPrincipal().toString())
    : null;

  const authorName =
    (profile?.name && !isPrincipalFormat(profile.name) ? profile.name : null) ||
    (profile?.handle && !isPrincipalFormat(profile.handle)
      ? profile.handle
      : null) ||
    (!isPrincipalFormat(localName) ? localName : null) ||
    profile?.name ||
    profile?.handle ||
    localName ||
    (identity
      ? `User ${identity.getPrincipal().toString().slice(0, 6)}`
      : "Anonymous");

  const clearMedia = () => {
    setMediaFile(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ShortSport video validation
    if (postType === "video") {
      if (!file.type.startsWith("video/")) {
        toast.error("ShortSport only accepts videos (no photos or GIFs)");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Check duration — max 3 minutes (180 seconds)
      const tempVideo = document.createElement("video");
      const objectUrl = URL.createObjectURL(file);
      tempVideo.src = objectUrl;
      tempVideo.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        if (tempVideo.duration > 180) {
          toast.error("Videos must be under 3 minutes for ShortSport");
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
        // Valid video — set it
        setMediaFile(file);
        setError("");
        const previewUrl = URL.createObjectURL(file);
        setMediaPreview(previewUrl);
      };
      tempVideo.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        toast.error("Could not read video file. Please try another.");
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      return;
    }

    setMediaFile(file);
    setError("");
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  const handleSubmit = async () => {
    if (!identity) {
      setError("You must be logged in to create a post.");
      return;
    }

    if (postType !== "text" && !mediaFile) {
      setError("Please select a media file.");
      return;
    }

    if (!caption.trim() && postType === "text") {
      setError("Please write something for your post.");
      return;
    }

    setError("");
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
        ? mediaFile.type ||
          (postType === "video"
            ? "video/mp4"
            : postType === "gif"
              ? "image/gif"
              : "image/jpeg")
        : "text";

      await createPost.mutateAsync({
        authorName,
        media: mediaBlob,
        mediaFile: mediaFile ?? undefined,
        mediaType,
        caption: caption.trim(),
      });

      toast.success("Post created successfully!");
      navigate({ to: "/" });
    } catch (err: any) {
      const msg = err?.message ?? "Failed to create post. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const canSubmit = (() => {
    if (isUploading || createPost.isPending) return false;
    if (postType === "text") return caption.trim().length > 0;
    return !!mediaFile;
  })();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-display font-bold text-foreground">
            Create Post
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/" })}
            className="text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Post type selector */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {(["text", "image", "video", "gif", "poster"] as PostType[]).map(
            (type) => {
              const icons = {
                text: FileText,
                image: Image,
                video: Video,
                gif: Smile,
                poster: Layers,
              };
              const Icon = icons[type];
              const labels = {
                text: "Text",
                image: "Photo",
                video: "Video",
                gif: "GIF",
                poster: "Poster",
              };
              return (
                <button
                  type="button"
                  key={type}
                  data-ocid={`create_post.${type}_tab`}
                  onClick={() => {
                    setPostType(type);
                    clearMedia();
                    setError("");
                  }}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all duration-200 ${
                    postType === type
                      ? "border-gold-500 bg-gold-500/10 text-gold-400"
                      : "border-border bg-surface-1 text-muted-foreground hover:border-gold-500/50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{labels[type]}</span>
                </button>
              );
            },
          )}
        </div>

        {/* Media upload area */}
        {postType !== "text" && (
          <div className="mb-5">
            <Label className="text-sm font-medium text-foreground mb-2 block">
              {postType === "image"
                ? "Photo"
                : postType === "video"
                  ? "Video (max 3 min)"
                  : postType === "gif"
                    ? "GIF"
                    : "Poster"}
            </Label>
            {mediaPreview ? (
              <div className="relative rounded-xl overflow-hidden bg-surface-2">
                {postType === "video" ? (
                  <video
                    src={mediaPreview}
                    className="w-full max-h-64 object-cover"
                    controls
                  >
                    <track kind="captions" />
                  </video>
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full max-h-64 object-cover"
                  />
                )}
                <button
                  type="button"
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
                    <p className="text-white text-xs mt-1 text-center">
                      {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                data-ocid="create_post.upload_button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 hover:border-gold-500/50 transition-colors bg-surface-1"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Tap to upload{" "}
                    {postType === "image"
                      ? "photo"
                      : postType === "video"
                        ? "video"
                        : postType === "gif"
                          ? "GIF"
                          : "poster"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {postType === "video"
                      ? "MP4, MOV, WebM · max 3 minutes"
                      : postType === "gif"
                        ? "GIF"
                        : "JPG, PNG, GIF, WebP"}
                  </p>
                </div>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={
                postType === "video"
                  ? "video/*"
                  : postType === "gif"
                    ? "image/gif"
                    : "image/*"
              }
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Caption */}
        <div className="mb-5">
          <Label
            htmlFor="caption"
            className="text-sm font-medium text-foreground mb-2 block"
          >
            {postType === "text" ? "What's on your mind?" : "Caption"}
          </Label>
          <Textarea
            id="caption"
            placeholder={
              postType === "text"
                ? "Share your thoughts..."
                : "Write a caption..."
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
        <div className="pb-6 pt-2">
          <Button
            data-ocid="create_post.submit_button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            size="lg"
            className="w-full text-white font-bold rounded-2xl py-4 text-base shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            style={{
              background: canSubmit
                ? "linear-gradient(135deg, #f5c842 0%, #e8a020 45%, #06b6d4 100%)"
                : undefined,
              color: canSubmit ? "oklch(0.05 0.008 265)" : undefined,
              boxShadow: canSubmit
                ? "0 4px 24px oklch(0.78 0.16 75 / 0.30)"
                : undefined,
            }}
          >
            {isUploading || createPost.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {isUploading ? `Uploading… ${uploadProgress}%` : "Posting…"}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Post to Feed &amp; ShortSport
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
