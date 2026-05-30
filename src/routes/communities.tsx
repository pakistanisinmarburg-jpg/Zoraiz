import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";

export const Route = createFileRoute("/communities")({ component: Communities });

function Communities() {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const { data: comms } = await (supabase as any).from("communities").select("*").order("name");
      const ids = (comms ?? []).map((c: any) => c.id);
      const counts = new Map<string, number>();
      if (ids.length) {
        const { data: mems } = await (supabase as any).from("community_members").select("community_id").in("community_id", ids);
        (mems ?? []).forEach((m: any) => counts.set(m.community_id, (counts.get(m.community_id) ?? 0) + 1));
      }
      return (comms ?? []).map((c: any) => ({ ...c, member_count: counts.get(c.id) ?? 0 }));
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-foreground">{t("communities.title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("communities.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to={user ? "/communities/new" : "/login"}>
                <Plus className="mr-2 h-4 w-4" />
                {t("communities.newCommunity")}
              </Link>
            </Button>
            {isAdmin && <Button variant="outline" asChild><Link to="/admin">{t("admin.addCommunity")}</Link></Button>}
          </div>
        </div>
        {isLoading ? (
          <p className="mt-10 text-muted-foreground">{t("common.loading")}</p>
        ) : (data ?? []).length === 0 ? (
          <p className="mt-10 text-muted-foreground">{t("common.empty")}</p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(data ?? []).map((c: any) => (
              <Link key={c.id} to="/communities/$slug" params={{ slug: c.slug }} className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary">
                {c.cover_url && <img src={c.cover_url} alt="" className="aspect-video w-full object-cover" />}
                <div className="p-6">
                  <p className="font-display text-xl text-card-foreground">{c.name}</p>
                  {c.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
                  <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" /> {c.member_count} {t("communities.members")}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
