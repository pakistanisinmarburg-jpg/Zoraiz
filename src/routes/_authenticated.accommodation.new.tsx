import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/image-uploader";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accommodation/new")({ component: NewAcco });

const TYPES = ["room", "apartment", "shared_flat"] as const;

function NewAcco() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", type: "room", rent: "", deposit: "", address: "", description: "", available_from: "" });
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.from("accommodations").insert({
      user_id: user.id,
      title: form.title.trim(),
      type: form.type as typeof TYPES[number],
      rent_cents: Math.round(parseFloat(form.rent || "0") * 100),
      deposit_cents: Math.round(parseFloat(form.deposit || "0") * 100),
      address: form.address || null,
      description: form.description || null,
      available_from: form.available_from || null,
    }).select("id").single();
    if (error || !data) { setBusy(false); return toast.error(error?.message ?? "Failed"); }
    if (images.length) {
      await supabase.from("accommodation_images").insert(images.map((url, i) => ({ accommodation_id: data.id, url, position: i })));
    }
    toast.success(t("common.success"));
    navigate({ to: "/accommodation/$id", params: { id: data.id } });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-4xl text-foreground">{t("accommodation.newListing")}</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div><Label>{t("common.title")}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={120} /></div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t2) => <SelectItem key={t2} value={t2}>{t(`accommodation.types.${t2}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("accommodation.rent")}</Label><Input type="number" step="0.01" value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} required /></div>
            <div><Label>{t("accommodation.deposit")}</Label><Input type="number" step="0.01" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} /></div>
          </div>
          <div><Label>{t("accommodation.address")}</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><Label>{t("accommodation.availableFrom")}</Label><Input type="date" value={form.available_from} onChange={(e) => setForm({ ...form, available_from: e.target.value })} /></div>
          <div><Label>{t("common.description")}</Label><Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>{t("common.image")}</Label><ImageUploader bucket="accommodation-images" userId={user!.id} urls={images} onChange={setImages} /></div>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>{t("common.create")}</Button>
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/accommodation" })}>{t("common.cancel")}</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
