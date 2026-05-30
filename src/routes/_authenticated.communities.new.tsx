import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/communities/new")({ component: NewCommunity });

function NewCommunity() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user || !name.trim() || !slug.trim()) return;
    setBusy(true);
    const { data, error } = await (supabase as any).from("communities").insert({
      name: name.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
      description: description.trim() || null,
      created_by: user.id,
    }).select("slug").single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/communities/$slug", params: { slug: data.slug } });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-3xl text-foreground">{t("communities.newCommunity")}</h1>
        <div className="mt-8 space-y-4">
          <Input placeholder={t("communities.name")} value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder={t("communities.slug")} value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Textarea placeholder={t("common.description")} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          <Button onClick={submit} disabled={busy || !name.trim() || !slug.trim()}>{t("common.create")}</Button>
        </div>
      </main>
    </div>
  );
}
