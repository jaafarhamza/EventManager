'use client';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
  subtitle?: string;
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  purple: 'from-purple-500 to-purple-600',
  yellow: 'from-yellow-500 to-yellow-600',
  red: 'from-red-500 to-red-600',
};

export function StatsCard({ title, value, icon, color, subtitle }: StatsCardProps) {
  return (
    <div className="bg-(--color-card) border border-(--color-border) rounded-2xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-(--color-muted-foreground) mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-(--color-foreground) mb-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-(--color-muted-foreground)">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${colorClasses[color]} flex items-center justify-center text-2xl shadow-md`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
