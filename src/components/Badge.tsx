import { type ReactNode } from "react";
import clsx from "clsx";

type BadgeProps = {
  children: ReactNode;
  variant?: "glow" | "outline";
};

export function Badge({ children, variant = "glow" }: BadgeProps) {
  const base = "inline-flex items-center rounded-full px-4 py-1 text-sm font-semibold transition";
  const styles = {
    glow: "bg-gradient-to-r from-amber-400/80 via-emerald-400/60 to-rose-500/70 text-slate-900 shadow-[0_10px_30px_rgba(248,250,252,0.35)]",
    outline: "border border-emerald-400/30 text-emerald-100"
  };
  return <span className={clsx(base, styles[variant])}>{children}</span>;
}
