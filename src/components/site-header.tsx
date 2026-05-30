"use client";

import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Globe,
  Search,
  Menu,
  Home,
  Store,
  Building2,
  Briefcase,
  Users,
  HelpCircle,
  LayoutDashboard,
  Shield,
  List,
  Bell,
  User,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";

const publicNav = [
  { to: "/marketplace" as const, labelKey: "nav.marketplace", icon: Store },
  { to: "/accommodation" as const, labelKey: "nav.accommodation", icon: Building2 },
  { to: "/jobs" as const, labelKey: "nav.jobs", icon: Briefcase },
  { to: "/communities" as const, labelKey: "nav.communities", icon: Users },
  { to: "/qa" as const, labelKey: "nav.qa", icon: HelpCircle },
];

const authNav = [
  { to: "/dashboard" as const, labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/my-listings" as const, labelKey: "common.myListings", icon: List },
  { to: "/notifications" as const, labelKey: "common.notifications", icon: Bell },
  { to: "/profile" as const, labelKey: "common.profile", icon: User },
];

export function SiteHeader() {
  const { t, i18n } = useTranslation();
  const { user, signOut, isAdmin } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const langLabel = mounted ? (i18n.language === "de" ? "DE" : "EN") : "EN";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="font-display text-xl font-semibold text-foreground">
          {t("common.appName")}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden gap-6 text-sm md:flex">
          {publicNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t(item.labelKey)}
            </Link>
          ))}
          {user && (
            <Link
              to="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("nav.dashboard")}
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("common.admin")}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/search">
              <Search className="h-4 w-4" />
            </Link>
          </Button>

          <div className="hidden md:block">
            <NotificationBell />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => i18n.changeLanguage(i18n.language === "de" ? "en" : "de")}
            className="gap-1"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{langLabel}</span>
          </Button>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                {t("common.signOut")}
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">{t("common.signIn")}</Link>
                </Button>
                <Button size="sm" asChild className="rounded-full">
                  <Link to="/signup">{t("common.signUp")}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 sm:w-80">
              <SheetHeader>
                <SheetTitle className="font-display text-lg">
                  {t("common.appName")}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-1">
                <SheetClose asChild>
                  <Link
                    to="/"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <Home className="h-4 w-4" />
                    {t("nav.home")}
                  </Link>
                </SheetClose>

                <Separator className="my-2" />

                {publicNav.map((item) => (
                  <SheetClose key={item.to} asChild>
                    <Link
                      to={item.to}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <item.icon className="h-4 w-4" />
                      {t(item.labelKey)}
                    </Link>
                  </SheetClose>
                ))}

                {user && (
                  <>
                    <Separator className="my-2" />
                    {authNav.map((item) => (
                      <SheetClose key={item.to} asChild>
                        <Link
                          to={item.to}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        >
                          <item.icon className="h-4 w-4" />
                          {t(item.labelKey)}
                        </Link>
                      </SheetClose>
                    ))}
                  </>
                )}

                {isAdmin && (
                  <>
                    <Separator className="my-2" />
                    <SheetClose asChild>
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        <Shield className="h-4 w-4" />
                        {t("common.admin")}
                      </Link>
                    </SheetClose>
                  </>
                )}

                <Separator className="my-2" />

                {user ? (
                  <button
                    onClick={() => {
                      setOpen(false);
                      signOut();
                    }}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("common.signOut")}
                  </button>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Link
                        to="/login"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        <LogIn className="h-4 w-4" />
                        {t("common.signIn")}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to="/signup"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        <UserPlus className="h-4 w-4" />
                        {t("common.signUp")}
                      </Link>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
