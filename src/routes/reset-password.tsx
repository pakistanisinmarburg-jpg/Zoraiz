import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({ component: ResetPassword });

function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPw, setNewPw] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("auth.checkEmail"));
  };

  const updatePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("common.success"));
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8">
        <h1 className="font-display text-3xl text-card-foreground">{recovery ? t("common.newPassword") : t("common.resetPassword")}</h1>
        {recovery ? (
          <form onSubmit={updatePw} className="mt-6 space-y-4">
            <div><Label>{t("common.newPassword")}</Label><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} /></div>
            <Button type="submit" className="w-full" disabled={busy}>{t("common.updatePassword")}</Button>
          </form>
        ) : (
          <form onSubmit={sendLink} className="mt-6 space-y-4">
            <div><Label>{t("common.email")}</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <Button type="submit" className="w-full" disabled={busy}>{t("common.sendResetLink")}</Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm"><Link to="/login" className="text-primary">← {t("common.signIn")}</Link></p>
      </div>
    </div>
  );
}
