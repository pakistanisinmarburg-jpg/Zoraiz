import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/qa")({ component: QA });

const CATS = ["general", "housing", "visa", "study", "work", "health", "family"] as const;

function QA() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["questions"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("questions").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => (data ?? []).filter((x: any) => {
    if (cat !== "all" && x.category !== cat) return false;
    if (q && !`${x.title} ${x.body ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [data, q, cat]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-foreground">{t("qa.title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("qa.subtitle")}</p>
          </div>
          <Button asChild><Link to={user ? "/qa/new" : "/login"}>+ {t("qa.ask")}</Link></Button>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Input placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {CATS.map((c) => <SelectItem key={c} value={c}>{t(`qa.categories.${c}`)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {isLoading ? (
          <p className="mt-10 text-muted-foreground">{t("common.loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="mt-10 text-muted-foreground">{t("common.empty")}</p>
        ) : (
          <div className="mt-10 space-y-3">
            {filtered.map((qn: any) => (
              <Link key={qn.id} to="/qa/$id" params={{ id: qn.id }} className="block rounded-2xl border border-border bg-card p-6 transition hover:border-primary">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t(`qa.categories.${qn.category as "general"}`)}</p>
                <p className="mt-2 font-display text-xl text-card-foreground">{qn.title}</p>
                {qn.body && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{qn.body}</p>}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
