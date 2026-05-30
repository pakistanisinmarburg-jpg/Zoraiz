import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";

export function NotificationBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { t } = useTranslation();

  const { data } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data ?? []) as { id: string; title: string; body: string | null; link: string | null; read: boolean; created_at: string }[];
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["notifications", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  if (!user) return null;
  const unread = (data ?? []).filter((n) => !n.read).length;

  const markAll = async () => {
    await (supabase as any).from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications", user.id] });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border p-3">
          <p className="text-sm font-medium">{t("common.notifications")}</p>
          {unread > 0 && <button onClick={markAll} className="text-xs text-primary hover:underline">{t("common.markAllRead")}</button>}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {(data ?? []).length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">{t("common.empty")}</p>
          ) : (
            (data ?? []).map((n) => {
              const Item = (
                <div className={`border-b border-border p-3 text-sm ${n.read ? "" : "bg-accent/30"}`}>
                  <p className="font-medium">{n.title}</p>
                  {n.body && <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>}
                </div>
              );
              return n.link ? (
                <Link key={n.id} to={n.link as any} className="block hover:bg-accent/50">{Item}</Link>
              ) : (
                <div key={n.id}>{Item}</div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
