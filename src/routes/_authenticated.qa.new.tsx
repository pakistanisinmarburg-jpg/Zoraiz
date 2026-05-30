import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/qa/new")({ component: NewQuestion });

const CATS = ["general", "housing", "visa", "study", "work", "health", "family"] as const;

function NewQuestion() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user || !title.trim()) return;
    setBusy(true);
    const { data, error } = await (supabase as any).from("questions").insert({ user_id: user.id, title: title.trim(), body: body.trim() || null, category }).select("id").single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/qa/$id", params: { id: data.id } });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-3xl text-foreground">{t("qa.ask")}</h1>
        <div className="mt-8 space-y-4">
          <Input placeholder={t("common.title")} value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATS.map((c) => <SelectItem key={c} value={c}>{t(`qa.categories.${c}`)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea placeholder={t("common.description")} value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
          <Button onClick={submit} disabled={busy || !title.trim()}>{t("common.submit")}</Button>
        </div>
      </main>
    </div>
  );
}
