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

export const Route = createFileRoute("/marketplace")({ component: Marketplace });

const CATS = ["furniture", "electronics", "bikes", "books", "clothing", "kitchen", "other"] as const;

function Marketplace() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["marketplace_listings"],
    queryFn: async () => {
      const { data: listings } = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      const ids = (listings ?? []).map((l) => l.id);
      const { data: imgs } = ids.length
        ? await supabase.from("marketplace_images").select("listing_id, url").in("listing_id", ids).order("position")
        : { data: [] as { listing_id: string; url: string }[] };
      const firstImg = new Map<string, string>();
      (imgs ?? []).forEach((i) => { if (!firstImg.has(i.listing_id)) firstImg.set(i.listing_id, i.url); });
      return (listings ?? []).map((l) => ({ ...l, image: firstImg.get(l.id) }));
    },
  });

  const filtered = useMemo(() => {
    return (data ?? []).filter((l) => {
      if (cat !== "all" && l.category !== cat) return false;
      if (q && !`${l.title} ${l.description ?? ""} ${l.location ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [data, q, cat]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-foreground">{t("marketplace.title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("marketplace.subtitle")}</p>
          </div>
          <Button asChild><Link to={user ? "/marketplace/new" : "/login"}>+ {t("marketplace.newListing")}</Link></Button>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Input placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {CATS.map((c) => <SelectItem key={c} value={c}>{t(`marketplace.categories.${c}`)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {isLoading ? (
          <p className="mt-10 text-muted-foreground">{t("common.loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="mt-10 text-muted-foreground">{t("common.empty")}</p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((l) => (
              <Link key={l.id} to="/marketplace/$id" params={{ id: l.id }} className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary">
                {l.image && <img src={l.image} alt="" className="aspect-video w-full object-cover" />}
                <div className="p-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{t(`marketplace.categories.${l.category as "other"}`)}</p>
                  <p className="mt-2 font-medium text-card-foreground">{l.title}</p>
                  <p className="mt-2 font-display text-2xl text-primary">€{(l.price_cents / 100).toFixed(0)}</p>
                  {l.location && <p className="mt-1 text-xs text-muted-foreground">{l.location}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
