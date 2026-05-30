import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications-page", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any).from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const markAll = async () => {
    await (supabase as any).from("notifications").update({ read: true }).eq("user_id", user!.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications-page", user!.id] });
    qc.invalidateQueries({ queryKey: ["notifications", user!.id] });
  };

  const remove = async (id: string) => {
    await (supabase as any).from("notifications").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications-page", user!.id] });
    qc.invalidateQueries({ queryKey: ["notifications", user!.id] });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl text-foreground">{t("common.notifications")}</h1>
          <Button variant="outline" size="sm" onClick={markAll}>{t("common.markAllRead")}</Button>
        </div>
        <div className="mt-8 space-y-2">
          {(data ?? []).length === 0 ? (
            <p className="text-muted-foreground">{t("common.empty")}</p>
          ) : (data ?? []).map((n: any) => (
            <div key={n.id} className={`flex items-start justify-between gap-4 rounded-2xl border border-border p-5 ${n.read ? "bg-card" : "bg-accent/30"}`}>
              <div className="flex-1">
                {n.link ? (
                  <Link to={n.link} className="font-medium text-card-foreground hover:underline">{n.title}</Link>
                ) : (
                  <p className="font-medium text-card-foreground">{n.title}</p>
                )}
                {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                <p className="mt-2 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => remove(n.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
