import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

export const Route = createFileRoute("/_authenticated/marketplace/$id/edit")({ component: EditListing });

const CATS = ["furniture", "electronics", "bikes", "books", "clothing", "kitchen", "other"] as const;

function EditListing() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", category: "other", price: "", location: "", description: "", status: "active" });
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("marketplace_listings").select("*").eq("id", id).maybeSingle();
      if (!data) { toast.error("Not found"); navigate({ to: "/marketplace" }); return; }
      if (data.user_id !== user?.id && !isAdmin) { toast.error("Forbidden"); navigate({ to: "/marketplace" }); return; }
      setForm({
        title: data.title, category: data.category, price: (data.price_cents / 100).toString(),
        location: data.location ?? "", description: data.description ?? "", status: data.status,
      });
      const { data: imgs } = await supabase.from("marketplace_images").select("url").eq("listing_id", id).order("position");
      setImages((imgs ?? []).map((i) => i.url));
      setLoading(false);
    })();
  }, [id, user, isAdmin, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("marketplace_listings").update({
      title: form.title.trim(), category: form.category,
      price_cents: Math.round(parseFloat(form.price || "0") * 100),
      location: form.location || null, description: form.description || null,
      status: form.status as "active" | "sold" | "archived",
    }).eq("id", id);
    if (error) return toast.error(error.message);
    await supabase.from("marketplace_images").delete().eq("listing_id", id);
    if (images.length) await supabase.from("marketplace_images").insert(images.map((url, i) => ({ listing_id: id, url, position: i })));
    toast.success(t("common.success"));
    navigate({ to: "/marketplace/$id", params: { id } });
  };

  const onDelete = async () => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("marketplace_listings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("common.success"));
    navigate({ to: "/marketplace" });
  };

  if (loading) return <div className="min-h-screen bg-background"><SiteHeader /><div className="p-10 text-muted-foreground">{t("common.loading")}</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-4xl text-foreground">{t("common.edit")}</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div><Label>{t("common.title")}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>{t("common.category")}</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{t(`marketplace.categories.${c}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("marketplace.priceCents")}</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
          </div>
          <div><Label>{t("common.location")}</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div><Label>{t("common.description")}</Label><Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="sold">{t("marketplace.soldBadge")}</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>{t("common.image")}</Label><ImageUploader bucket="marketplace-images" userId={user!.id} urls={images} onChange={setImages} /></div>
          <div className="flex gap-2">
            <Button type="submit">{t("common.save")}</Button>
            <Button type="button" variant="destructive" onClick={onDelete}>{t("common.delete")}</Button>
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/marketplace/$id", params: { id } })}>{t("common.cancel")}</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
