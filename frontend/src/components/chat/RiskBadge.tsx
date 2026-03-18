import { Badge } from "@/components/ui/badge";
import type { RiskLabel } from "@/types";
import { cn } from "@/lib/utils";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

interface RiskBadgeProps {
  label: RiskLabel;
  score?: number;
  className?: string;
}

const config: Record<RiskLabel, { icon: typeof Shield; variant: "success" | "warning" | "destructive"; text: string }> = {
  low: { icon: ShieldCheck, variant: "success", text: "Low Risk" },
  medium: { icon: Shield, variant: "warning", text: "Medium Risk" },
  high: { icon: ShieldAlert, variant: "destructive", text: "High Risk" },
};

export default function RiskBadge({ label, score, className }: RiskBadgeProps) {
  const c = config[label];
  const Icon = c.icon;

  return (
    <Badge variant={c.variant} className={cn("gap-1", className)}>
      <Icon className="h-3 w-3" />
      {c.text}
      {score !== undefined && (
        <span className="ml-1 opacity-75">({(score * 100).toFixed(0)}%)</span>
      )}
    </Badge>
  );
}
