import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React from "react";
import { ChartRenderer } from "@/components/common/ChartRenderer";

const colorStyles = {
  primary: {
    card: "bg-card border-primary/20",
    iconBg: "bg-primary/10",
    iconText: "text-primary",
    valueText: "text-foreground",
    sparkline: "hsl(var(--primary))",
  },
  emerald: {
    card: "bg-card border-emerald-500/20",
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-600",
    valueText: "text-emerald-600",
    sparkline: "#10b981",
  },
  amber: {
    card: "bg-card border-amber-500/20",
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-600",
    valueText: "text-amber-600",
    sparkline: "#f59e0b",
  },
  blue: {
    card: "bg-card border-blue-500/20",
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-600",
    valueText: "text-blue-600",
    sparkline: "#3b82f6",
  },
  indigo: {
    card: "bg-card border-indigo-500/20",
    iconBg: "bg-indigo-500/10",
    iconText: "text-indigo-600",
    valueText: "text-indigo-600",
    sparkline: "#6366f1",
  },
  rose: {
    card: "bg-card border-rose-500/20",
    iconBg: "bg-rose-500/10",
    iconText: "text-rose-600",
    valueText: "text-rose-600",
    sparkline: "#f43f5e",
  },
  orange: {
    card: "bg-card border-orange-500/20",
    iconBg: "bg-orange-500/10",
    iconText: "text-orange-600",
    valueText: "text-orange-600",
    sparkline: "#f97316",
  },
  secondary: {
    card: "bg-card border-secondary/20",
    iconBg: "bg-secondary/10",
    iconText: "text-secondary",
    valueText: "text-foreground",
    sparkline: "hsl(var(--secondary))",
  },
  accent: {
    card: "bg-card border-accent/20",
    iconBg: "bg-accent/10",
    iconText: "text-accent",
    valueText: "text-foreground",
    sparkline: "hsl(var(--accent))",
  },
  success: {
    card: "bg-card border-emerald-500/20",
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-600",
    valueText: "text-emerald-600",
    sparkline: "#10b981",
  },
  destructive: {
    card: "bg-card border-destructive/20",
    iconBg: "bg-destructive/10",
    iconText: "text-destructive",
    valueText: "text-destructive",
    sparkline: "hsl(var(--destructive))",
  },
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  trend?: {
    value: string | number;
    label?: string;
    type: "increase" | "decrease" | "neutral";
  };
  sparklineData?: { value: number }[];
  color?: keyof typeof colorStyles;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  sparklineData,
  color = "primary",
  className,
}: StatCardProps) {
  const styles = colorStyles[color] || colorStyles.primary;

  const series = [{
    data: sparklineData?.map(d => d.value) || []
  }];

  const chartOptions = {
    chart: {
      sparkline: { enabled: true },
    },
    colors: [styles.sparkline],
    stroke: {
      width: 2,
    },
    tooltip: { enabled: false }
  };

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md border shadow-sm", styles.card, className)}>
      <CardContent className="p-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className={cn("text-2xl font-bold tracking-tight", styles.valueText)}>
              {value}
            </h3>
            {trend && (
              <span
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5",
                  trend.type === "increase" && "bg-emerald-500/10 text-emerald-600",
                  trend.type === "decrease" && "bg-rose-500/10 text-rose-600",
                  trend.type === "neutral" && "bg-slate-500/10 text-slate-600"
                )}
              >
                {trend.type === "increase" ? "↑" : trend.type === "decrease" ? "↓" : "•"}
                {trend.value}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            <div className={cn("p-1 rounded-md shrink-0", styles.iconBg)}>
              <Icon className={cn("h-3.5 w-3.5", styles.iconText)} />
            </div>
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-1 truncate">{description}</p>
            )}
          </div>
          {sparklineData && (
            <div className="h-8 w-16 shrink-0">
              <ChartRenderer type="line" series={series} options={chartOptions} height={32} showToolbar={false} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
