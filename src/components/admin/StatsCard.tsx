import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatsCardAccent = 'cyan' | 'purple' | 'pink' | 'amber' | 'emerald';

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  description?: string;
  secondaryValue?: string;
  badge?: string;
  accent?: StatsCardAccent;
  highlight?: boolean;
  className?: string;
}

const ACCENT_STYLES: Record<
  StatsCardAccent,
  {
    badgeBg: string;
    iconColor: string;
    orbGlow: string;
    borderGlow: string;
    pillClass: string;
  }
> = {
  cyan: {
    badgeBg:
      'bg-gradient-to-br from-cyan-400/20 via-cyan-500/15 to-purple-500/20 border border-cyan-400/30 shadow-[0_0_20px_rgba(0,217,255,0.22)]',
    iconColor: 'text-cyan-300',
    orbGlow: 'bg-cyan-400/15',
    borderGlow: 'ring-1 ring-cyan-400/35 shadow-[0_0_32px_rgba(0,217,255,0.16)]',
    pillClass: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/30',
  },
  purple: {
    badgeBg:
      'bg-gradient-to-br from-purple-400/20 via-violet-500/15 to-cyan-500/15 border border-purple-400/30 shadow-[0_0_20px_rgba(168,85,247,0.24)]',
    iconColor: 'text-purple-300',
    orbGlow: 'bg-purple-500/15',
    borderGlow: 'ring-1 ring-purple-400/35 shadow-[0_0_32px_rgba(168,85,247,0.18)]',
    pillClass: 'bg-purple-500/15 text-purple-200 border-purple-400/30',
  },
  pink: {
    badgeBg:
      'bg-gradient-to-br from-pink-400/20 via-fuchsia-500/15 to-purple-500/20 border border-pink-400/30 shadow-[0_0_20px_rgba(244,114,182,0.24)]',
    iconColor: 'text-pink-300',
    orbGlow: 'bg-pink-500/15',
    borderGlow: 'ring-1 ring-pink-400/35 shadow-[0_0_32px_rgba(244,114,182,0.18)]',
    pillClass: 'bg-pink-500/15 text-pink-200 border-pink-400/30',
  },
  amber: {
    badgeBg:
      'bg-gradient-to-br from-amber-400/25 via-orange-500/15 to-pink-500/15 border border-amber-400/35 shadow-[0_0_22px_rgba(251,191,36,0.26)]',
    iconColor: 'text-amber-300',
    orbGlow: 'bg-amber-400/20',
    borderGlow: 'ring-1 ring-amber-400/45 shadow-[0_0_36px_rgba(251,191,36,0.22)]',
    pillClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
  },
  emerald: {
    badgeBg:
      'bg-gradient-to-br from-emerald-400/20 via-teal-500/15 to-cyan-500/15 border border-emerald-400/30 shadow-[0_0_20px_rgba(52,211,153,0.22)]',
    iconColor: 'text-emerald-300',
    orbGlow: 'bg-emerald-400/15',
    borderGlow: 'ring-1 ring-emerald-400/35 shadow-[0_0_32px_rgba(52,211,153,0.18)]',
    pillClass: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  secondaryValue,
  badge,
  accent = 'cyan',
  highlight = false,
  className,
}: StatsCardProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <div
      className={cn(
        'glass-card group rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-4 transition-all duration-200',
        highlight && styles.borderGlow,
        className
      )}
    >
      {/* Subtle ambient corner glow */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -top-10 -end-10 h-28 w-28 rounded-full blur-2xl opacity-60 group-hover:opacity-90 transition-opacity duration-300',
          styles.orbGlow
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div
          className={cn(
            'h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
            styles.badgeBg
          )}
        >
          <Icon className={cn('w-5 h-5', styles.iconColor)} />
        </div>

        <div className="flex flex-col items-end gap-1">
          {badge && (
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border font-numeric',
                styles.pillClass
              )}
            >
              {badge}
            </span>
          )}
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold font-numeric border',
                trend.isPositive
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25'
                  : 'bg-rose-500/15 text-rose-300 border-rose-400/25'
              )}
            >
              <span>
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
              {trend.label && <span className="opacity-80">{trend.label}</span>}
            </span>
          )}
        </div>
      </div>

      <div className="relative space-y-1">
        <h3 className="text-slate-300/90 text-sm font-medium leading-snug">{title}</h3>
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <p className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight font-numeric leading-tight">
            {value}
          </p>
          {secondaryValue && (
            <span className="text-sm font-bold text-cyan-300/90 font-numeric">
              {secondaryValue}
            </span>
          )}
        </div>
        {description && (
          <p className="text-slate-400 text-xs leading-relaxed pt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}
