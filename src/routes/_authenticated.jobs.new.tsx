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
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/jobs/new")({ component: NewJob });

const TYPES = ["full_time", "part_time", "mini_job", "internship", "freelance"] as const;

function NewJob() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ company: "", position: "", employment_type: "full_time", location: "", salary_text: "", description: "" });
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.company.trim() || !form.position.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.from("jobs").insert({
      user_id: user.id,
      company: form.company.trim(), position: form.position.trim(),
      employment_type: form.employment_type, location: form.location || null,
      salary_text: form.salary_text || null, description: form.description || null,
    }).select("id").single();
    if (error || !data) { setBusy(false); return toast.error(error?.message ?? "Failed"); }
    toast.success(t("common.success"));
    navigate({ to: "/jobs/$id", params: { id: data.id } });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-4xl text-foreground">{t("jobs.newJob")}</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>{t("jobs.company")}</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required /></div>
            <div><Label>{t("jobs.position")}</Label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} required /></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>{t("jobs.employmentType")}</Label>
              <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((tt) => <SelectItem key={tt} value={tt}>{t(`jobs.types.${tt}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("common.location")}</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          </div>
          <div><Label>{t("jobs.salary")}</Label><Input value={form.salary_text} onChange={(e) => setForm({ ...form, salary_text: e.target.value })} placeholder="e.g. €15/h" /></div>
          <div><Label>{t("common.description")}</Label><Textarea rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>{t("common.create")}</Button>
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/jobs" })}>{t("common.cancel")}</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
