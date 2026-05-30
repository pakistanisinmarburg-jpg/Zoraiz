import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/marketplace/$id")({ component: Detail });

function Detail() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const [{ data: l }, { data: imgs }] = await Promise.all([
        supabase.from("marketplace_listings").select("*").eq("id", id).maybeSingle(),
        supabase.from("marketplace_images").select("url").eq("listing_id", id).order("position"),
      ]);
      return { l, imgs: imgs ?? [] };
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link to="/marketplace" className="text-sm text-muted-foreground">← {t("nav.marketplace")}</Link>
        {isLoading ? <p className="mt-6 text-muted-foreground">{t("common.loading")}</p> :
          !data?.l ? <p className="mt-6 text-muted-foreground">{t("common.empty")}</p> : (
          <div className="mt-6 rounded-3xl border border-border bg-card p-8">
            {data.imgs.length > 0 && (
              <div className="mb-6 grid grid-cols-2 gap-3">
                {data.imgs.map((i) => <img key={i.url} src={i.url} alt="" className="aspect-square rounded-xl object-cover" />)}
              </div>
            )}
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t(`marketplace.categories.${data.l.category as "other"}`)}</p>
            <h1 className="mt-2 font-display text-4xl text-card-foreground">{data.l.title}</h1>
            <p className="mt-4 font-display text-3xl text-primary">€{(data.l.price_cents / 100).toFixed(0)}</p>
            {data.l.status === "sold" && <p className="mt-2 inline-block rounded-full bg-muted px-3 py-1 text-xs">{t("marketplace.soldBadge")}</p>}
            {data.l.location && <p className="mt-2 text-sm text-muted-foreground">{data.l.location}</p>}
            <p className="mt-6 whitespace-pre-wrap text-card-foreground">{data.l.description}</p>
            {(user?.id === data.l.user_id || isAdmin) && (
              <div className="mt-6"><Button asChild variant="outline"><Link to="/marketplace/$id/edit" params={{ id }}>{t("common.edit")}</Link></Button></div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
