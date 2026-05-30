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

export const Route = createFileRoute("/accommodation")({ component: Page });

const TYPES = ["room", "apartment", "shared_flat"] as const;

function Page() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [maxRent, setMaxRent] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["accommodations"],
    queryFn: async () => {
      const { data: rows } = await supabase.from("accommodations").select("*").eq("status", "active").order("created_at", { ascending: false });
      const ids = (rows ?? []).map((r) => r.id);
      const { data: imgs } = ids.length
        ? await supabase.from("accommodation_images").select("accommodation_id, url").in("accommodation_id", ids).order("position")
        : { data: [] as { accommodation_id: string; url: string }[] };
      const firstImg = new Map<string, string>();
      (imgs ?? []).forEach((i) => { if (!firstImg.has(i.accommodation_id)) firstImg.set(i.accommodation_id, i.url); });
      return (rows ?? []).map((r) => ({ ...r, image: firstImg.get(r.id) }));
    },
  });

  const filtered = useMemo(() => (data ?? []).filter((a) => {
    if (type !== "all" && a.type !== type) return false;
    if (maxRent && a.rent_cents > parseFloat(maxRent) * 100) return false;
    if (q && !`${a.title} ${a.description ?? ""} ${a.address ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [data, q, type, maxRent]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-foreground">{t("accommodation.title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("accommodation.subtitle")}</p>
          </div>
          <Button asChild><Link to={user ? "/accommodation/new" : "/login"}>+ {t("accommodation.newListing")}</Link></Button>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Input placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {TYPES.map((tt) => <SelectItem key={tt} value={tt}>{t(`accommodation.types.${tt}`)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" placeholder="Max rent €" value={maxRent} onChange={(e) => setMaxRent(e.target.value)} className="w-36" />
        </div>
        {isLoading ? <p className="mt-10 text-muted-foreground">{t("common.loading")}</p> :
         filtered.length === 0 ? <p className="mt-10 text-muted-foreground">{t("common.empty")}</p> : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <Link key={a.id} to="/accommodation/$id" params={{ id: a.id }} className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary">
                {a.image && <img src={a.image} alt="" className="aspect-video w-full object-cover" />}
                <div className="p-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{t(`accommodation.types.${a.type as "room"}`)}</p>
                  <p className="mt-2 font-medium text-card-foreground">{a.title}</p>
                  <p className="mt-2 font-display text-xl text-primary">€{(a.rent_cents / 100).toFixed(0)} / mo</p>
                  {a.address && <p className="mt-1 text-xs text-muted-foreground">{a.address}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
