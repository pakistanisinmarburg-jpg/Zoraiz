import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/search")({ component: SearchPage });

function SearchPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["global-search", q],
    enabled: q.trim().length >= 2,
    queryFn: async () => {
      const term = `%${q.trim()}%`;
      const [m, a, j, qn] = await Promise.all([
        supabase.from("marketplace_listings").select("id,title,price_cents,category").eq("status", "active").ilike("title", term).limit(10),
        supabase.from("accommodations").select("id,title,rent_cents,type").eq("status", "active").ilike("title", term).limit(10),
        supabase.from("jobs").select("id,company,position,location").eq("status", "active").ilike("position", term).limit(10),
        (supabase as any).from("questions").select("id,title,category").ilike("title", term).limit(10),
      ]);
      return {
        marketplace: (m.data ?? []) as any[],
        accommodation: (a.data ?? []) as any[],
        jobs: (j.data ?? []) as any[],
        qa: (qn.data ?? []) as any[],
      };
    },
  });

  const total = data ? data.marketplace.length + data.accommodation.length + data.jobs.length + data.qa.length : 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-4xl text-foreground">{t("common.search")}</h1>
        <Input autoFocus placeholder={t("common.searchEverything")} value={q} onChange={(e) => setQ(e.target.value)} className="mt-6" />

        {q.trim().length < 2 ? null : isLoading ? (
          <p className="mt-8 text-muted-foreground">{t("common.loading")}</p>
        ) : total === 0 ? (
          <p className="mt-8 text-muted-foreground">{t("common.noResults")}</p>
        ) : (
          <div className="mt-10 space-y-10">
            {data!.marketplace.length > 0 && (
              <Section title={t("nav.marketplace")}>
                {data!.marketplace.map((x) => (
                  <Link key={x.id} to="/marketplace/$id" params={{ id: x.id }} className="block rounded-xl border border-border bg-card p-4 hover:border-primary">
                    <p className="text-sm font-medium text-card-foreground">{x.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">€{(x.price_cents / 100).toFixed(0)} · {x.category}</p>
                  </Link>
                ))}
              </Section>
            )}
            {data!.accommodation.length > 0 && (
              <Section title={t("nav.accommodation")}>
                {data!.accommodation.map((x) => (
                  <Link key={x.id} to="/accommodation/$id" params={{ id: x.id }} className="block rounded-xl border border-border bg-card p-4 hover:border-primary">
                    <p className="text-sm font-medium text-card-foreground">{x.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">€{(x.rent_cents / 100).toFixed(0)}/mo · {x.type}</p>
                  </Link>
                ))}
              </Section>
            )}
            {data!.jobs.length > 0 && (
              <Section title={t("nav.jobs")}>
                {data!.jobs.map((x) => (
                  <Link key={x.id} to="/jobs/$id" params={{ id: x.id }} className="block rounded-xl border border-border bg-card p-4 hover:border-primary">
                    <p className="text-sm font-medium text-card-foreground">{x.position}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{x.company}{x.location ? ` · ${x.location}` : ""}</p>
                  </Link>
                ))}
              </Section>
            )}
            {data!.qa.length > 0 && (
              <Section title={t("nav.qa")}>
                {data!.qa.map((x) => (
                  <Link key={x.id} to="/qa/$id" params={{ id: x.id }} className="block rounded-xl border border-border bg-card p-4 hover:border-primary">
                    <p className="text-sm font-medium text-card-foreground">{x.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{x.category}</p>
                  </Link>
                ))}
              </Section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-xl text-foreground">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}
