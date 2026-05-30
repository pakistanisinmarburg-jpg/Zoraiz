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

export const Route = createFileRoute("/_authenticated/accommodation/$id/edit")({ component: EditAcco });

const TYPES = ["room", "apartment", "shared_flat"] as const;

function EditAcco() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", type: "room", rent: "", deposit: "", address: "", description: "", available_from: "", status: "active" });
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("accommodations").select("*").eq("id", id).maybeSingle();
      if (!data) { navigate({ to: "/accommodation" }); return; }
      if (data.user_id !== user?.id && !isAdmin) { toast.error("Forbidden"); navigate({ to: "/accommodation" }); return; }
      setForm({
        title: data.title, type: data.type,
        rent: (data.rent_cents / 100).toString(),
        deposit: (data.deposit_cents / 100).toString(),
        address: data.address ?? "", description: data.description ?? "",
        available_from: data.available_from ?? "", status: data.status,
      });
      const { data: imgs } = await supabase.from("accommodation_images").select("url").eq("accommodation_id", id).order("position");
      setImages((imgs ?? []).map((i) => i.url));
      setLoading(false);
    })();
  }, [id, user, isAdmin, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("accommodations").update({
      title: form.title.trim(), type: form.type as typeof TYPES[number],
      rent_cents: Math.round(parseFloat(form.rent || "0") * 100),
      deposit_cents: Math.round(parseFloat(form.deposit || "0") * 100),
      address: form.address || null, description: form.description || null,
      available_from: form.available_from || null,
      status: form.status as "active" | "sold" | "archived",
    }).eq("id", id);
    if (error) return toast.error(error.message);
    await supabase.from("accommodation_images").delete().eq("accommodation_id", id);
    if (images.length) await supabase.from("accommodation_images").insert(images.map((url, i) => ({ accommodation_id: id, url, position: i })));
    toast.success(t("common.success"));
    navigate({ to: "/accommodation/$id", params: { id } });
  };

  const onDelete = async () => {
    if (!confirm("Delete?")) return;
    const { error } = await supabase.from("accommodations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    navigate({ to: "/accommodation" });
  };

  if (loading) return <div className="min-h-screen bg-background"><SiteHeader /><div className="p-10 text-muted-foreground">{t("common.loading")}</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-4xl text-foreground">{t("common.edit")}</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div><Label>{t("common.title")}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((tt) => <SelectItem key={tt} value={tt}>{t(`accommodation.types.${tt}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("accommodation.rent")}</Label><Input type="number" step="0.01" value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} required /></div>
            <div><Label>{t("accommodation.deposit")}</Label><Input type="number" step="0.01" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} /></div>
          </div>
          <div><Label>{t("accommodation.address")}</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><Label>{t("accommodation.availableFrom")}</Label><Input type="date" value={form.available_from} onChange={(e) => setForm({ ...form, available_from: e.target.value })} /></div>
          <div><Label>{t("common.description")}</Label><Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>{t("common.image")}</Label><ImageUploader bucket="accommodation-images" userId={user!.id} urls={images} onChange={setImages} /></div>
          <div className="flex gap-2">
            <Button type="submit">{t("common.save")}</Button>
            <Button type="button" variant="destructive" onClick={onDelete}>{t("common.delete")}</Button>
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/accommodation/$id", params: { id } })}>{t("common.cancel")}</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
