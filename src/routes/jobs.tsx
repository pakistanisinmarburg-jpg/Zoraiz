import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/jobs")({ component: Page });

const TYPES = ["full_time", "part_time", "mini_job", "internship", "freelance"] as const;

function Page() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => (await supabase.from("jobs").select("*").eq("status", "active").order("created_at", { ascending: false })).data ?? [],
  });

  const filtered = useMemo(() => (data ?? []).filter((j) => {
    if (type !== "all" && j.employment_type !== type) return false;
    if (q && !`${j.position} ${j.company} ${j.description ?? ""} ${j.location ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [data, q, type]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-foreground">{t("jobs.title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("jobs.subtitle")}</p>
          </div>
          <Button asChild><Link to={user ? "/jobs/new" : "/login"}>+ {t("jobs.newJob")}</Link></Button>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Input placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {TYPES.map((tt) => <SelectItem key={tt} value={tt}>{t(`jobs.types.${tt}`)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {isLoading ? <p className="mt-10 text-muted-foreground">{t("common.loading")}</p> :
         filtered.length === 0 ? <p className="mt-10 text-muted-foreground">{t("common.empty")}</p> : (
          <div className="mt-10 space-y-4">
            {filtered.map((j) => (
              <Link key={j.id} to="/jobs/$id" params={{ id: j.id }} className="block rounded-2xl border border-border bg-card p-6 transition hover:border-primary">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t(`jobs.types.${j.employment_type as "full_time"}`)}</p>
                <p className="mt-1 font-display text-xl text-card-foreground">{j.position}</p>
                <p className="text-sm text-muted-foreground">{j.company} {j.location && `• ${j.location}`}</p>
                {j.salary_text && <p className="mt-2 text-sm text-primary">{j.salary_text}</p>}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
