import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { ShoppingBag, Home, Briefcase } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Marburg Connect — Your home away from home" },
      { name: "description", content: "Marketplace, accommodation and jobs for internationals living in Marburg." },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useTranslation();
  const [slideIndex, setSlideIndex] = useState(0);

  const { data: slides } = useQuery({
    queryKey: ["slider_images"],
    queryFn: async () => {
      const { data } = await supabase
        .from("slider_images")
        .select("*")
        .order("position", { ascending: true });
      return data ?? [];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      return data;
    },
  });

  const { data: latestListings } = useQuery({
    queryKey: ["latest_listings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("marketplace_listings")
        .select("id, title, price_cents, currency, category")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const heroImages = slides && slides.length > 0 ? slides : [
    { id: "fallback-1", url: "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=1600&q=80", caption: "Marburg" },
    { id: "fallback-2", url: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1600&q=80", caption: "Old town" },
  ];

  useEffect(() => {
    if (heroImages.length < 2) return;
    const id = setInterval(() => setSlideIndex((i) => (i + 1) % heroImages.length), 5000);
    return () => clearInterval(id);
  }, [heroImages.length]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative h-[80vh] min-h-[560px] w-full overflow-hidden">
        {heroImages.map((img, i) => (
          <div
            key={img.id}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === slideIndex ? 1 : 0 }}
          >
            <img src={img.url} alt={img.caption ?? ""} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
          </div>
        ))}
        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-20">
          <p className="font-sans text-sm uppercase tracking-[0.25em] text-gold">{t("landing.heroEyebrow")}</p>
          <h1 className="mt-4 font-display text-6xl font-semibold leading-[0.95] text-foreground md:text-8xl">
            {settings?.hero_title ?? t("landing.heroTitleA")}
            <br />
            <span className="italic text-primary">{t("landing.heroTitleB")}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            {settings?.hero_subtitle ?? t("landing.heroBody")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/signup">{t("common.getStarted")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link to="/marketplace">{t("nav.marketplace")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="font-display text-4xl text-foreground md:text-5xl">{t("landing.features")}</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: ShoppingBag, to: "/marketplace", title: t("landing.featMarketTitle"), body: t("landing.featMarketBody") },
            { icon: Home, to: "/accommodation", title: t("landing.featAccoTitle"), body: t("landing.featAccoBody") },
            { icon: Briefcase, to: "/jobs", title: t("landing.featJobsTitle"), body: t("landing.featJobsBody") },
          ].map((f) => (
            <Link
              key={f.title}
              to={f.to}
              className="group rounded-3xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg"
            >
              <f.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-6 font-display text-2xl text-card-foreground">{f.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{f.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest listings */}
      {latestListings && latestListings.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <h2 className="font-display text-3xl text-foreground">{t("landing.latestListings")}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {latestListings.map((l) => (
              <Link key={l.id} to="/marketplace/$id" params={{ id: l.id }} className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{l.category}</p>
                <p className="mt-2 font-medium text-card-foreground">{l.title}</p>
                <p className="mt-2 font-display text-xl text-primary">€{(l.price_cents / 100).toFixed(0)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-border bg-accent/40 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl text-foreground md:text-5xl">{t("landing.ctaTitle")}</h2>
          <p className="mt-4 text-muted-foreground">{t("landing.ctaBody")}</p>
          <Button asChild size="lg" className="mt-8 rounded-full">
            <Link to="/signup">{t("common.signUp")}</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Marburg Connect
      </footer>
    </div>
  );
}
