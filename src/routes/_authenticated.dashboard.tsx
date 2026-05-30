import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/site-header";
import { ShoppingBag, Home, Briefcase, User, ListChecks, Shield, Users, HelpCircle, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const tiles = [
    { to: "/marketplace", icon: ShoppingBag, label: t("nav.marketplace") },
    { to: "/accommodation", icon: Home, label: t("nav.accommodation") },
    { to: "/jobs", icon: Briefcase, label: t("nav.jobs") },
    { to: "/communities", icon: Users, label: t("nav.communities") },
    { to: "/qa", icon: HelpCircle, label: t("nav.qa") },
    { to: "/notifications", icon: Bell, label: t("common.notifications") },
    { to: "/my-listings", icon: ListChecks, label: "My listings" },
    { to: "/profile", icon: User, label: t("common.profile") },
    ...(isAdmin ? [{ to: "/admin", icon: Shield, label: t("common.admin") }] : []),
  ];
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="font-display text-4xl text-foreground">{t("common.dashboard")}</h1>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {tiles.map((tile) => (
            <Link key={tile.to} to={tile.to} className="group rounded-3xl border border-border bg-card p-8 transition hover:border-primary">
              <tile.icon className="h-7 w-7 text-primary" />
              <p className="mt-6 font-display text-xl text-card-foreground">{tile.label}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
