import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/jobs/$id")({ component: Detail });

function Detail() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["job", id, user?.id],
    queryFn: async () => {
      const [{ data: j }, { data: saved }] = await Promise.all([
        supabase.from("jobs").select("*").eq("id", id).maybeSingle(),
        user ? supabase.from("saved_jobs").select("job_id").eq("user_id", user.id).eq("job_id", id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      return { j, isSaved: !!saved };
    },
  });

  const toggleSave = async () => {
    if (!user) return toast.error("Sign in to save");
    if (data?.isSaved) {
      await supabase.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", id);
    } else {
      await supabase.from("saved_jobs").insert({ user_id: user.id, job_id: id });
    }
    qc.invalidateQueries({ queryKey: ["job", id] });
    qc.invalidateQueries({ queryKey: ["saved_jobs"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link to="/jobs" className="text-sm text-muted-foreground">← {t("nav.jobs")}</Link>
        {!data?.j ? <p className="mt-6 text-muted-foreground">{t("common.loading")}</p> : (
          <div className="mt-6 rounded-3xl border border-border bg-card p-8">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t(`jobs.types.${data.j.employment_type as "full_time"}`)}</p>
            <h1 className="mt-1 font-display text-4xl text-card-foreground">{data.j.position}</h1>
            <p className="text-muted-foreground">{data.j.company} {data.j.location && `• ${data.j.location}`}</p>
            {data.j.salary_text && <p className="mt-3 text-primary">{data.j.salary_text}</p>}
            <p className="mt-6 whitespace-pre-wrap text-card-foreground">{data.j.description}</p>
            <div className="mt-6 flex gap-2">
              {user && <Button variant={data.isSaved ? "outline" : "default"} onClick={toggleSave}>{data.isSaved ? t("jobs.unsave") : t("jobs.save")}</Button>}
              {(user?.id === data.j.user_id || isAdmin) && (
                <Button asChild variant="outline"><Link to="/jobs/$id/edit" params={{ id }}>{t("common.edit")}</Link></Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
