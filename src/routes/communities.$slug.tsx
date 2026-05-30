import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ReportButton } from "@/components/report-button";
import { toast } from "sonner";
import { Users, Trash2 } from "lucide-react";

export const Route = createFileRoute("/communities/$slug")({ component: CommunityDetail });

function CommunityDetail() {
  const { slug } = Route.useParams();
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: c } = useQuery({
    queryKey: ["community", slug],
    queryFn: async () => {
      const { data } = await (supabase as any).from("communities").select("*").eq("slug", slug).maybeSingle();
      return data;
    },
  });

  const { data: isMember } = useQuery({
    queryKey: ["community-member", c?.id, user?.id],
    enabled: !!c && !!user,
    queryFn: async () => {
      const { data } = await (supabase as any).from("community_members").select("user_id").eq("community_id", c.id).eq("user_id", user!.id).maybeSingle();
      return !!data;
    },
  });

  const { data: memberCount } = useQuery({
    queryKey: ["community-count", c?.id],
    enabled: !!c,
    queryFn: async () => {
      const { count } = await (supabase as any).from("community_members").select("user_id", { count: "exact", head: true }).eq("community_id", c.id);
      return count ?? 0;
    },
  });

  const { data: posts } = useQuery({
    queryKey: ["community-posts", c?.id],
    enabled: !!c,
    queryFn: async () => {
      const { data } = await (supabase as any).from("community_posts").select("*").eq("community_id", c.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  if (!c) return <div className="min-h-screen bg-background"><SiteHeader /><main className="mx-auto max-w-4xl px-6 py-12"><p className="text-muted-foreground">{t("common.loading")}</p></main></div>;

  const toggleMembership = async () => {
    if (!user) { navigate({ to: "/login" }); return; }
    if (isMember) {
      await (supabase as any).from("community_members").delete().eq("community_id", c.id).eq("user_id", user.id);
    } else {
      await (supabase as any).from("community_members").insert({ community_id: c.id, user_id: user.id });
    }
    qc.invalidateQueries({ queryKey: ["community-member", c.id, user.id] });
    qc.invalidateQueries({ queryKey: ["community-count", c.id] });
  };

  const post = async () => {
    if (!user || !title.trim()) return;
    setBusy(true);
    const { error } = await (supabase as any).from("community_posts").insert({ community_id: c.id, user_id: user.id, title: title.trim(), body: body.trim() || null });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setTitle(""); setBody("");
    qc.invalidateQueries({ queryKey: ["community-posts", c.id] });
  };

  const deletePost = async (id: string) => {
    await (supabase as any).from("community_posts").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["community-posts", c.id] });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Link to="/communities" className="text-sm text-muted-foreground hover:text-foreground">← {t("communities.title")}</Link>
        {c.cover_url && <img src={c.cover_url} alt="" className="mt-6 aspect-[3/1] w-full rounded-3xl object-cover" />}
        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-foreground">{c.name}</h1>
            {c.description && <p className="mt-2 max-w-2xl text-muted-foreground">{c.description}</p>}
            <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground"><Users className="h-4 w-4" /> {memberCount ?? 0} {t("communities.members")}</p>
          </div>
          {user && (
            <Button onClick={toggleMembership} variant={isMember ? "outline" : "default"}>
              {isMember ? t("communities.leave") : t("communities.join")}
            </Button>
          )}
        </div>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-foreground">{t("communities.posts")}</h2>
          {user && isMember ? (
            <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-6">
              <Input placeholder={t("common.title")} value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea placeholder={t("communities.body")} value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
              <Button onClick={post} disabled={busy || !title.trim()}>{t("communities.newPost")}</Button>
            </div>
          ) : user ? (
            <p className="mt-4 text-sm text-muted-foreground">{t("communities.joinToPost")}</p>
          ) : null}

          <div className="mt-8 space-y-4">
            {(posts ?? []).length === 0 ? (
              <p className="text-muted-foreground">{t("common.empty")}</p>
            ) : (posts ?? []).map((p: any) => (
              <article key={p.id} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-display text-xl text-card-foreground">{p.title}</h3>
                {p.body && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{p.body}</p>}
                <div className="mt-4 flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</p>
                  <ReportButton targetType="community_post" targetId={p.id} />
                  {(p.user_id === user?.id || isAdmin) && (
                    <Button variant="ghost" size="sm" onClick={() => deletePost(p.id)} className="gap-1 text-muted-foreground"><Trash2 className="h-3 w-3" /> {t("common.delete")}</Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
