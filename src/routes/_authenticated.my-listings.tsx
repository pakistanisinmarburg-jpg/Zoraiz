import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/my-listings")({ component: MyListings });

function MyListings() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: ml } = useQuery({
    queryKey: ["my_marketplace", user?.id],
    queryFn: async () => (await supabase.from("marketplace_listings").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
    enabled: !!user,
  });
  const { data: ac } = useQuery({
    queryKey: ["my_accommodation", user?.id],
    queryFn: async () => (await supabase.from("accommodations").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
    enabled: !!user,
  });
  const { data: jb } = useQuery({
    queryKey: ["my_jobs", user?.id],
    queryFn: async () => (await supabase.from("jobs").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
    enabled: !!user,
  });
  const { data: saved } = useQuery({
    queryKey: ["saved_jobs", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("saved_jobs").select("job_id, jobs(*)").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-4xl text-foreground">My listings</h1>
        <Tabs defaultValue="marketplace" className="mt-8">
          <TabsList>
            <TabsTrigger value="marketplace">{t("nav.marketplace")}</TabsTrigger>
            <TabsTrigger value="accommodation">{t("nav.accommodation")}</TabsTrigger>
            <TabsTrigger value="jobs">{t("nav.jobs")}</TabsTrigger>
            <TabsTrigger value="saved">{t("jobs.savedJobs")}</TabsTrigger>
          </TabsList>
          <TabsContent value="marketplace" className="mt-6">
            <Button asChild className="mb-4"><Link to="/marketplace/new">{t("marketplace.newListing")}</Link></Button>
            <div className="space-y-2">
              {(ml ?? []).map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <div><p className="font-medium">{l.title}</p><p className="text-xs text-muted-foreground">{l.status} · €{(l.price_cents / 100).toFixed(0)}</p></div>
                  <Button asChild size="sm" variant="outline"><Link to="/marketplace/$id/edit" params={{ id: l.id }}>{t("common.edit")}</Link></Button>
                </div>
              ))}
              {!ml?.length && <p className="text-muted-foreground">{t("common.empty")}</p>}
            </div>
          </TabsContent>
          <TabsContent value="accommodation" className="mt-6">
            <Button asChild className="mb-4"><Link to="/accommodation/new">{t("accommodation.newListing")}</Link></Button>
            <div className="space-y-2">
              {(ac ?? []).map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <div><p className="font-medium">{l.title}</p><p className="text-xs text-muted-foreground">{l.status} · €{(l.rent_cents / 100).toFixed(0)}/mo</p></div>
                  <Button asChild size="sm" variant="outline"><Link to="/accommodation/$id/edit" params={{ id: l.id }}>{t("common.edit")}</Link></Button>
                </div>
              ))}
              {!ac?.length && <p className="text-muted-foreground">{t("common.empty")}</p>}
            </div>
          </TabsContent>
          <TabsContent value="jobs" className="mt-6">
            <Button asChild className="mb-4"><Link to="/jobs/new">{t("jobs.newJob")}</Link></Button>
            <div className="space-y-2">
              {(jb ?? []).map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <div><p className="font-medium">{l.position}</p><p className="text-xs text-muted-foreground">{l.company} · {l.status}</p></div>
                  <Button asChild size="sm" variant="outline"><Link to="/jobs/$id/edit" params={{ id: l.id }}>{t("common.edit")}</Link></Button>
                </div>
              ))}
              {!jb?.length && <p className="text-muted-foreground">{t("common.empty")}</p>}
            </div>
          </TabsContent>
          <TabsContent value="saved" className="mt-6">
            <div className="space-y-2">
              {(saved ?? []).map((s) => {
                const j = s.jobs as { id: string; position: string; company: string } | null;
                if (!j) return null;
                return (
                  <Link key={s.job_id} to="/jobs/$id" params={{ id: j.id }} className="block rounded-xl border border-border bg-card p-4 hover:border-primary">
                    <p className="font-medium">{j.position}</p>
                    <p className="text-xs text-muted-foreground">{j.company}</p>
                  </Link>
                );
              })}
              {!saved?.length && <p className="text-muted-foreground">{t("common.empty")}</p>}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
