import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center glass rounded-2xl border border-border bg-surface-alt/50 h-full min-h-[300px]">
      <div className="w-20 h-20 bg-surface rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-border/50 text-text-muted relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-surface to-surface-alt opacity-50"></div>
        <Icon size={32} className="relative z-10" />
      </div>
      
      <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="px-6 py-2.5 bg-primary-ghost text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-colors border border-primary/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
