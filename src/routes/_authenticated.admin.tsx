import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({ component: Admin });

function Admin() {
  const { t } = useTranslation();
  const { isAdmin, isLoading, user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading && !isAdmin) navigate({ to: "/dashboard" });
  }, [isAdmin, isLoading, navigate]);
  if (isLoading || !isAdmin || !user) return <div className="min-h-screen bg-background"><SiteHeader /></div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-display text-4xl text-foreground">{t("admin.title")}</h1>
        <Tabs defaultValue="slider" className="mt-8">
          <TabsList>
            <TabsTrigger value="slider">{t("admin.slider")}</TabsTrigger>
            <TabsTrigger value="settings">{t("admin.siteSettings")}</TabsTrigger>
            <TabsTrigger value="users">{t("admin.users")}</TabsTrigger>
            <TabsTrigger value="listings">{t("admin.listingsOverview")}</TabsTrigger>
            <TabsTrigger value="communities">{t("admin.communities")}</TabsTrigger>
            <TabsTrigger value="reports">{t("admin.reports")}</TabsTrigger>
          </TabsList>
          <TabsContent value="slider" className="mt-6"><SliderAdmin userId={user.id} /></TabsContent>
          <TabsContent value="settings" className="mt-6"><SettingsAdmin /></TabsContent>
          <TabsContent value="users" className="mt-6"><UsersAdmin /></TabsContent>
          <TabsContent value="listings" className="mt-6"><ListingsAdmin /></TabsContent>
          <TabsContent value="communities" className="mt-6"><CommunitiesAdmin userId={user.id} /></TabsContent>
          <TabsContent value="reports" className="mt-6"><ReportsAdmin /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function SliderAdmin({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [caption, setCaption] = useState("");
  const { data: slides } = useQuery({
    queryKey: ["admin_slides"],
    queryFn: async () => (await supabase.from("slider_images").select("*").order("position")).data ?? [],
  });

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadImage("slider-images", userId, file);
      const pos = (slides?.length ?? 0);
      const { error } = await supabase.from("slider_images").insert({ url, caption: caption || null, position: pos });
      if (error) throw error;
      setCaption("");
      qc.invalidateQueries({ queryKey: ["admin_slides"] });
      qc.invalidateQueries({ queryKey: ["slides"] });
      toast.success(t("common.success"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      e.target.value = "";
    }
  };

  const onDelete = async (id: string) => {
    await supabase.from("slider_images").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin_slides"] });
    qc.invalidateQueries({ queryKey: ["slides"] });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="font-medium">{t("admin.addSlide")}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div><Label>{t("admin.caption")}</Label><Input value={caption} onChange={(e) => setCaption(e.target.value)} /></div>
          <div><Label>{t("common.image")}</Label><Input type="file" accept="image/*" onChange={onUpload} /></div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(slides ?? []).map((s) => (
          <div key={s.id} className="overflow-hidden rounded-xl border border-border bg-card">
            <img src={s.url} alt="" className="aspect-video w-full object-cover" />
            <div className="flex items-center justify-between p-3">
              <p className="text-sm text-muted-foreground">{s.caption || "—"}</p>
              <Button size="icon" variant="ghost" onClick={() => onDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsAdmin() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ hero_title: "", hero_subtitle: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) setForm({ hero_title: data.hero_title, hero_subtitle: data.hero_subtitle });
      setLoading(false);
    });
  }, []);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("site_settings").update(form).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success(t("common.success"));
  };

  if (loading) return <p className="text-muted-foreground">{t("common.loading")}</p>;
  return (
    <form onSubmit={onSave} className="max-w-xl space-y-4 rounded-xl border border-border bg-card p-5">
      <div><Label>{t("admin.heroTitle")}</Label><Input value={form.hero_title} onChange={(e) => setForm({ ...form, hero_title: e.target.value })} /></div>
      <div><Label>{t("admin.heroSubtitle")}</Label><Input value={form.hero_subtitle} onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })} /></div>
      <Button type="submit">{t("common.save")}</Button>
    </form>
  );
}

function UsersAdmin() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: users } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const roleMap = new Map<string, string[]>();
      (roles ?? []).forEach((r) => {
        const list = roleMap.get(r.user_id) ?? [];
        list.push(r.role);
        roleMap.set(r.user_id, list);
      });
      return (profiles ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [] }));
    },
  });

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    if (isAdmin) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    }
    qc.invalidateQueries({ queryKey: ["admin_users"] });
  };

  return (
    <div className="space-y-2">
      {(users ?? []).map((u) => {
        const isAdmin = u.roles.includes("admin");
        return (
          <div key={u.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div>
              <p className="font-medium">{u.full_name || u.email}</p>
              <p className="text-xs text-muted-foreground">{u.email} · {u.roles.join(", ") || "user"}</p>
            </div>
            <Button size="sm" variant={isAdmin ? "outline" : "default"} onClick={() => toggleAdmin(u.id, isAdmin)}>
              {isAdmin ? t("admin.removeAdmin") : t("admin.makeAdmin")}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function ListingsAdmin() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin_listings"],
    queryFn: async () => {
      const [m, a, j] = await Promise.all([
        supabase.from("marketplace_listings").select("id, title, status, created_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("accommodations").select("id, title, status, created_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("jobs").select("id, position, company, status, created_at").order("created_at", { ascending: false }).limit(50),
      ]);
      return { m: m.data ?? [], a: a.data ?? [], j: j.data ?? [] };
    },
  });

  const del = async (table: "marketplace_listings" | "accommodations" | "jobs", id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from(table).delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin_listings"] });
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div>
        <h3 className="mb-2 font-display text-lg">{t("nav.marketplace")}</h3>
        {data?.m.map((l) => (
          <div key={l.id} className="mb-2 flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm">
            <Link to="/marketplace/$id" params={{ id: l.id }} className="truncate hover:text-primary">{l.title}</Link>
            <Button size="icon" variant="ghost" onClick={() => del("marketplace_listings", l.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        ))}
      </div>
      <div>
        <h3 className="mb-2 font-display text-lg">{t("nav.accommodation")}</h3>
        {data?.a.map((l) => (
          <div key={l.id} className="mb-2 flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm">
            <Link to="/accommodation/$id" params={{ id: l.id }} className="truncate hover:text-primary">{l.title}</Link>
            <Button size="icon" variant="ghost" onClick={() => del("accommodations", l.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        ))}
      </div>
      <div>
        <h3 className="mb-2 font-display text-lg">{t("nav.jobs")}</h3>
        {data?.j.map((l) => (
          <div key={l.id} className="mb-2 flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm">
            <Link to="/jobs/$id" params={{ id: l.id }} className="truncate hover:text-primary">{l.position}</Link>
            <Button size="icon" variant="ghost" onClick={() => del("jobs", l.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommunitiesAdmin({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [busy, setBusy] = useState(false);

  const { data: comms } = useQuery({
    queryKey: ["admin_communities"],
    queryFn: async () => (await (supabase as any).from("communities").select("*").order("name")).data ?? [],
  });

  const create = async () => {
    if (!form.name.trim() || !form.slug.trim()) return;
    setBusy(true);
    const { error } = await (supabase as any).from("communities").insert({
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      description: form.description.trim() || null,
      created_by: userId,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setForm({ name: "", slug: "", description: "" });
    qc.invalidateQueries({ queryKey: ["admin_communities"] });
    qc.invalidateQueries({ queryKey: ["communities"] });
    toast.success(t("common.success"));
  };

  const remove = async (id: string) => {
    if (!confirm("Delete community?")) return;
    await (supabase as any).from("communities").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin_communities"] });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="font-medium">{t("admin.addCommunity")}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div><Label>{t("common.title")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="students" /></div>
          <div className="md:col-span-2"><Label>{t("common.description")}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <Button className="mt-4" onClick={create} disabled={busy || !form.name.trim() || !form.slug.trim()}>{t("common.create")}</Button>
      </div>
      <div className="space-y-2">
        {(comms ?? []).map((c: any) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm">
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">/{c.slug}</p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsAdmin() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin_reports"],
    queryFn: async () => (await (supabase as any).from("reports").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const setStatus = async (id: string, status: string) => {
    await (supabase as any).from("reports").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin_reports"] });
  };

  return (
    <div className="space-y-2">
      {(data ?? []).length === 0 ? (
        <p className="text-muted-foreground">{t("common.empty")}</p>
      ) : (data ?? []).map((r: any) => (
        <div key={r.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{r.target_type} · {r.status}</p>
              <p className="mt-1 font-medium">{r.reason}</p>
              {r.details && <p className="mt-1 text-sm text-muted-foreground">{r.details}</p>}
              <p className="mt-2 text-xs text-muted-foreground">target: {r.target_id} · {new Date(r.created_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "resolved")}>{t("admin.resolve")}</Button>
              <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "dismissed")}>{t("admin.dismiss")}</Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
