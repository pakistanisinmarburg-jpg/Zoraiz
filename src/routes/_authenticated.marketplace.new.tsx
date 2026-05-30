import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
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

export const Route = createFileRoute("/_authenticated/marketplace/new")({ component: NewListing });

const CATS = ["furniture", "electronics", "bikes", "books", "clothing", "kitchen", "other"] as const;
const schema = z.object({
  title: z.string().trim().min(2).max(120),
  category: z.enum(CATS),
  price_cents: z.number().int().min(0).max(100_000_00),
  location: z.string().trim().max(120).optional(),
  description: z.string().trim().max(4000).optional(),
});

function NewListing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", category: "other", price: "", location: "", description: "" });
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      title: form.title, category: form.category as typeof CATS[number],
      price_cents: Math.round(parseFloat(form.price || "0") * 100),
      location: form.location || undefined, description: form.description || undefined,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { data, error } = await supabase.from("marketplace_listings").insert({
      user_id: user.id,
      title: parsed.data.title,
      category: parsed.data.category,
      price_cents: parsed.data.price_cents,
      location: parsed.data.location ?? null,
      description: parsed.data.description ?? null,
    }).select("id").single();
    if (error || !data) { setBusy(false); return toast.error(error?.message ?? "Failed"); }
    if (images.length) {
      await supabase.from("marketplace_images").insert(images.map((url, i) => ({ listing_id: data.id, url, position: i })));
    }
    toast.success(t("common.success"));
    navigate({ to: "/marketplace/$id", params: { id: data.id } });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-4xl text-foreground">{t("marketplace.newListing")}</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div><Label>{t("common.title")}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={120} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>{t("common.category")}</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{t(`marketplace.categories.${c}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("marketplace.priceCents")}</Label><Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
          </div>
          <div><Label>{t("common.location")}</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} maxLength={120} /></div>
          <div><Label>{t("common.description")}</Label><Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={4000} /></div>
          <div><Label>{t("common.image")}</Label><ImageUploader bucket="marketplace-images" userId={user!.id} urls={images} onChange={setImages} /></div>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>{t("common.create")}</Button>
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/marketplace" })}>{t("common.cancel")}</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
