import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReportButton } from "@/components/report-button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/qa/$id")({ component: QuestionDetail });

function QuestionDetail() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();

  const { data: q } = useQuery({
    queryKey: ["question", id],
    queryFn: async () => {
      const { data } = await (supabase as any).from("questions").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  const { data: answers } = useQuery({
    queryKey: ["answers", id],
    queryFn: async () => {
      const { data } = await (supabase as any).from("answers").select("*").eq("question_id", id).order("created_at");
      return data ?? [];
    },
  });

  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  if (!q) return <div className="min-h-screen bg-background"><SiteHeader /><main className="mx-auto max-w-3xl px-6 py-12"><p className="text-muted-foreground">{t("common.loading")}</p></main></div>;

  const submit = async () => {
    if (!user || !body.trim()) return;
    setBusy(true);
    const { error } = await (supabase as any).from("answers").insert({ question_id: id, user_id: user.id, body: body.trim() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setBody("");
    qc.invalidateQueries({ queryKey: ["answers", id] });
    // notify question owner
    if (q.user_id !== user.id) {
      await (supabase as any).from("notifications").insert({
        user_id: q.user_id, type: "answer", title: "New answer on your question", body: q.title, link: `/qa/${id}`,
      });
    }
  };

  const deleteAnswer = async (aid: string) => {
    await (supabase as any).from("answers").delete().eq("id", aid);
    qc.invalidateQueries({ queryKey: ["answers", id] });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link to="/qa" className="text-sm text-muted-foreground hover:text-foreground">← {t("qa.title")}</Link>
        <article className="mt-6 rounded-3xl border border-border bg-card p-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t(`qa.categories.${q.category as "general"}`)}</p>
          <h1 className="mt-2 font-display text-3xl text-card-foreground">{q.title}</h1>
          {q.body && <p className="mt-4 whitespace-pre-wrap text-muted-foreground">{q.body}</p>}
          <div className="mt-4 flex items-center gap-3">
            <p className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleString()}</p>
            <ReportButton targetType="question" targetId={q.id} />
          </div>
        </article>

        <section className="mt-10">
          <h2 className="font-display text-2xl text-foreground">{t("qa.answers")} ({(answers ?? []).length})</h2>
          <div className="mt-6 space-y-3">
            {(answers ?? []).map((a: any) => (
              <div key={a.id} className="rounded-2xl border border-border bg-card p-6">
                <p className="whitespace-pre-wrap text-sm text-card-foreground">{a.body}</p>
                <div className="mt-3 flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                  <ReportButton targetType="answer" targetId={a.id} />
                  {(a.user_id === user?.id || isAdmin) && (
                    <Button variant="ghost" size="sm" onClick={() => deleteAnswer(a.id)} className="gap-1 text-muted-foreground"><Trash2 className="h-3 w-3" /> {t("common.delete")}</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {user ? (
            <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-medium text-card-foreground">{t("qa.yourAnswer")}</p>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder={t("qa.answer")} />
              <Button onClick={submit} disabled={busy || !body.trim()}>{t("common.submit")}</Button>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground"><Link to="/login" className="text-primary hover:underline">{t("common.signIn")}</Link> {t("common.or")} <Link to="/signup" className="text-primary hover:underline">{t("common.signUp")}</Link></p>
          )}
        </section>
      </main>
    </div>
  );
}
