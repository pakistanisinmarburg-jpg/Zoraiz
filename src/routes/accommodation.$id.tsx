import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/accommodation/$id")({ component: Detail });

function Detail() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const { data } = useQuery({
    queryKey: ["accommodation", id],
    queryFn: async () => {
      const [{ data: a }, { data: imgs }] = await Promise.all([
        supabase.from("accommodations").select("*").eq("id", id).maybeSingle(),
        supabase.from("accommodation_images").select("url").eq("accommodation_id", id).order("position"),
      ]);
      return { a, imgs: imgs ?? [] };
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link to="/accommodation" className="text-sm text-muted-foreground">← {t("nav.accommodation")}</Link>
        {!data?.a ? <p className="mt-6 text-muted-foreground">{t("common.loading")}</p> : (
          <div className="mt-6 rounded-3xl border border-border bg-card p-8">
            {data.imgs.length > 0 && (
              <div className="mb-6 grid grid-cols-2 gap-3">
                {data.imgs.map((i) => <img key={i.url} src={i.url} alt="" className="aspect-square rounded-xl object-cover" />)}
              </div>
            )}
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t(`accommodation.types.${data.a.type}`)}</p>
            <h1 className="mt-2 font-display text-4xl text-card-foreground">{data.a.title}</h1>
            <p className="mt-4 font-display text-3xl text-primary">€{(data.a.rent_cents / 100).toFixed(0)} / mo</p>
            {data.a.deposit_cents > 0 && <p className="text-sm text-muted-foreground">{t("accommodation.deposit")}: €{(data.a.deposit_cents / 100).toFixed(0)}</p>}
            {data.a.address && <p className="mt-2 text-sm text-muted-foreground">{data.a.address}</p>}
            {data.a.available_from && <p className="text-sm text-muted-foreground">{t("accommodation.availableFrom")}: {data.a.available_from}</p>}
            <p className="mt-6 whitespace-pre-wrap text-card-foreground">{data.a.description}</p>
            {(user?.id === data.a.user_id || isAdmin) && (
              <div className="mt-6"><Button asChild variant="outline"><Link to="/accommodation/$id/edit" params={{ id }}>{t("common.edit")}</Link></Button></div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
