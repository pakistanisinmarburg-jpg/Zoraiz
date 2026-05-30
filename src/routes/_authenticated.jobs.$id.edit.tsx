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
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/jobs/$id/edit")({ component: EditJob });

const TYPES = ["full_time", "part_time", "mini_job", "internship", "freelance"] as const;

function EditJob() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ company: "", position: "", employment_type: "full_time", location: "", salary_text: "", description: "", status: "active" });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
      if (!data) { navigate({ to: "/jobs" }); return; }
      if (data.user_id !== user?.id && !isAdmin) { toast.error("Forbidden"); navigate({ to: "/jobs" }); return; }
      setForm({
        company: data.company, position: data.position, employment_type: data.employment_type,
        location: data.location ?? "", salary_text: data.salary_text ?? "", description: data.description ?? "",
        status: data.status,
      });
      setLoading(false);
    })();
  }, [id, user, isAdmin, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("jobs").update({
      company: form.company.trim(), position: form.position.trim(),
      employment_type: form.employment_type, location: form.location || null,
      salary_text: form.salary_text || null, description: form.description || null,
      status: form.status as "active" | "sold" | "archived",
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("common.success"));
    navigate({ to: "/jobs/$id", params: { id } });
  };

  const onDelete = async () => {
    if (!confirm("Delete?")) return;
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    navigate({ to: "/jobs" });
  };

  if (loading) return <div className="min-h-screen bg-background"><SiteHeader /><div className="p-10 text-muted-foreground">{t("common.loading")}</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-4xl text-foreground">{t("common.edit")}</h1>
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
          <div><Label>{t("jobs.salary")}</Label><Input value={form.salary_text} onChange={(e) => setForm({ ...form, salary_text: e.target.value })} /></div>
          <div><Label>{t("common.description")}</Label><Textarea rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
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
          <div className="flex gap-2">
            <Button type="submit">{t("common.save")}</Button>
            <Button type="button" variant="destructive" onClick={onDelete}>{t("common.delete")}</Button>
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/jobs/$id", params: { id } })}>{t("common.cancel")}</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
