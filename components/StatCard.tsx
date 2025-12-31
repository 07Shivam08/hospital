
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'red' | 'white';
  subtitle?: string;
  alert?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, subtitle, alert }) => {
  const colorClasses = {
    blue: 'bg-blue-600 text-white',
    red: 'bg-red-600 text-white',
    white: 'bg-white text-slate-800 border border-slate-200',
  };

  const iconBgClasses = {
    blue: 'bg-blue-500/30',
    red: 'bg-red-500/30',
    white: 'bg-blue-50',
  };

  return (
    <div className={`${colorClasses[color]} p-6 rounded-2xl shadow-sm relative overflow-hidden transition-transform duration-300 hover:scale-[1.02]`}>
      {alert && (
        <div className="absolute top-0 right-0 p-2">
          <div className="animate-ping absolute h-3 w-3 rounded-full bg-red-400 opacity-75"></div>
          <div className="relative h-3 w-3 rounded-full bg-red-500"></div>
        </div>
      )}
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${color === 'white' ? 'text-slate-500' : 'text-blue-50'}`}>{title}</p>
          <h3 className="text-3xl font-bold mt-1">{value}</h3>
          {subtitle && (
            <p className={`text-xs mt-2 ${color === 'white' ? 'text-slate-400' : 'text-blue-100'}`}>{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBgClasses[color]}`}>
          <Icon className={color === 'white' ? 'text-blue-600' : 'text-white'} size={24} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
