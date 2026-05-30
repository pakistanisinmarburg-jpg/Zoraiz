import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Flag } from "lucide-react";
import { toast } from "sonner";

export function ReportButton({ targetType, targetId }: { targetType: string; targetId: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const submit = async () => {
    if (!reason.trim()) return;
    setBusy(true);
    const { error } = await (supabase as any).from("reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason: reason.trim(),
      details: details.trim() || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("common.reportSubmitted"));
    setOpen(false);
    setReason("");
    setDetails("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
          <Flag className="h-4 w-4" /> {t("common.report")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("common.report")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Textarea placeholder="Details (optional)" value={details} onChange={(e) => setDetails(e.target.value)} rows={4} />
          <Button onClick={submit} disabled={busy || !reason.trim()} className="w-full">{t("common.submit")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
