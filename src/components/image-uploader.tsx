import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadImage } from "@/lib/upload";
import { toast } from "sonner";
import { X } from "lucide-react";

interface Props {
  bucket: string;
  userId: string;
  urls: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export function ImageUploader({ bucket, userId, urls, onChange, max = 6 }: Props) {
  const [busy, setBusy] = useState(false);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    try {
      const next = [...urls];
      for (const f of files) {
        if (next.length >= max) break;
        const { url } = await uploadImage(bucket, userId, f);
        next.push(url);
      }
      onChange(next);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {urls.map((u, i) => (
          <div key={u} className="relative aspect-square overflow-hidden rounded-xl border border-border">
            <img src={u} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(urls.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-foreground hover:bg-background"
              aria-label="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      {urls.length < max && (
        <div className="flex items-center gap-3">
          <Input type="file" accept="image/*" multiple onChange={onPick} disabled={busy} />
          <Button type="button" variant="ghost" size="sm" disabled>{busy ? "…" : `${urls.length}/${max}`}</Button>
        </div>
      )}
    </div>
  );
}
