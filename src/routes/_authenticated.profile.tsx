import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({ component: Profile });

function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    full_name: "", nationality: "", designation: "", bio: "",
    hobbies: "", languages: "", phone: "", avatar_url: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setForm({
        full_name: data.full_name ?? "",
        nationality: data.nationality ?? "",
        designation: data.designation ?? "",
        bio: data.bio ?? "",
        hobbies: (data.hobbies ?? []).join(", "),
        languages: (data.languages ?? []).join(", "),
        phone: data.phone ?? "",
        avatar_url: data.avatar_url ?? "",
      });
      setLoading(false);
    });
  }, [user]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("profile-images").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data: { publicUrl } } = supabase.storage.from("profile-images").getPublicUrl(path);
    setForm((f) => ({ ...f, avatar_url: publicUrl }));
    toast.success(t("common.success"));
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name,
      nationality: form.nationality,
      designation: form.designation,
      bio: form.bio,
      hobbies: form.hobbies.split(",").map((s) => s.trim()).filter(Boolean),
      languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
      phone: form.phone,
      avatar_url: form.avatar_url,
    }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success(t("common.success"));
  };

  if (loading) return <div className="min-h-screen bg-background"><SiteHeader /><div className="p-10 text-muted-foreground">{t("common.loading")}</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-4xl text-foreground">{t("profile.title")}</h1>
        <form onSubmit={onSave} className="mt-8 space-y-5">
          <div className="flex items-center gap-4">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
            ) : <div className="h-20 w-20 rounded-full bg-muted" />}
            <Input type="file" accept="image/*" onChange={onUpload} />
          </div>
          <div><Label>{t("common.fullName")}</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>{t("profile.nationality")}</Label><Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div>
            <div><Label>{t("profile.designation")}</Label><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
          </div>
          <div><Label>{t("profile.bio")}</Label><Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          <div><Label>{t("profile.hobbies")}</Label><Input value={form.hobbies} onChange={(e) => setForm({ ...form, hobbies: e.target.value })} /></div>
          <div><Label>{t("profile.languages")}</Label><Input value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} /></div>
          <div><Label>{t("profile.phone")}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <Button type="submit">{t("common.save")}</Button>
        </form>
      </main>
    </div>
  );
}
