import { cn } from '../utils/cn';
import type { ComponentType, SVGProps } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  color?: 'primary' | 'rust' | 'spring' | 'blue' | 'green' | 'amber' | 'purple';
}

const StatsCard = ({ title, value, icon: Icon, trend, className, color = 'primary' }: StatsCardProps) => {
  const colorStyles = {
    primary: "bg-primary-50 text-primary-600",
    rust: "bg-rust-50 text-rust-600",
    spring: "bg-spring-leaves-50 text-spring-leaves-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className={cn("glass-card p-6 rounded-2xl card-glow", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-surface-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-surface-900 tracking-tight">{value}</h3>
        </div>
        <div className={cn("p-3 rounded-xl", colorStyles[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            trend.isPositive 
              ? "bg-green-100 text-green-700" 
              : "bg-red-100 text-red-700"
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-xs text-surface-400">vs last month</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
