import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Download,
  Film,
  Loader2,
  Share2,
  Upload,
} from "lucide-react";
import React, { useState } from "react";

interface ExportPanelProps {
  videoClip?: File | null;
  projectName?: string;
}

export default function ExportPanel({
  videoClip,
  projectName = "My Project",
}: ExportPanelProps) {
  const [title, setTitle] = useState(projectName);
  const [description, setDescription] = useState("");

  const handleDownload = () => {
    if (!videoClip) return;
    const url = URL.createObjectURL(videoClip);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "video"}.mp4`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5 p-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-1">
        <Film className="w-5 h-5 text-primary" />
        <h2 className="text-base font-semibold text-foreground">
          Export & Share
        </h2>
      </div>

      {/* Video preview */}
      {videoClip ? (
        <div className="rounded-lg overflow-hidden bg-black aspect-video">
          <video
            src={URL.createObjectURL(videoClip)}
            className="w-full h-full object-contain"
            controls
            muted
          />
        </div>
      ) : (
        <div className="rounded-lg bg-muted flex flex-col items-center justify-center aspect-video text-muted-foreground gap-2">
          <Film className="w-10 h-10 opacity-40" />
          <p className="text-sm">No video selected</p>
          <p className="text-xs opacity-60">
            Import a video clip to get started
          </p>
        </div>
      )}

      {/* Metadata fields */}
      <div className="flex flex-col gap-3">
        <div>
          <Label
            htmlFor="video-title"
            className="text-xs font-medium text-muted-foreground mb-1 block"
          >
            Title
          </Label>
          <Input
            id="video-title"
            placeholder="Enter video title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Label
            htmlFor="video-desc"
            className="text-xs font-medium text-muted-foreground mb-1 block"
          >
            Description
          </Label>
          <Textarea
            id="video-desc"
            placeholder="Add a description or caption…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      {/* Info: share via Create Post */}
      <div className="text-sm text-muted-foreground bg-muted rounded-lg px-3 py-3 text-center">
        To share your video publicly, download it and then use{" "}
        <span className="font-medium text-primary">Create Post</span> to upload
        it to the feed.
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2 mt-auto">
        <Button
          onClick={handleDownload}
          disabled={!videoClip}
          className="w-full"
          size="lg"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Video
        </Button>

        <Button variant="ghost" disabled={!videoClip} className="w-full">
          <Share2 className="w-4 h-4 mr-2" />
          Share Link
        </Button>
      </div>
    </div>
  );
}
