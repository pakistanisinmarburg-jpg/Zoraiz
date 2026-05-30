import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({ component: Signup });

function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(t("auth.signUpSuccess"));
    navigate({ to: "/dashboard" });
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) toast.error(result.error.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-8">
        <Link to="/" className="text-xs text-muted-foreground">← {t("common.backToHome")}</Link>
        <h1 className="mt-4 font-display text-3xl text-card-foreground">{t("common.createAccount")}</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div><Label>{t("common.fullName")}</Label><Input required value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div><Label>{t("common.email")}</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>{t("common.password")}</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={loading}>{t("common.signUp")}</Button>
        </form>
        <div className="my-4 text-center text-xs text-muted-foreground">{t("common.or")}</div>
        <Button variant="outline" className="w-full" onClick={onGoogle}>{t("common.continueWithGoogle")}</Button>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("common.haveAccount")} <Link to="/login" className="text-primary">{t("common.signIn")}</Link>
        </p>
      </div>
    </div>
  );
}
