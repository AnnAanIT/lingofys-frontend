import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  illustration?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  illustration,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-6">
        {illustration ? (
          illustration
        ) : Icon ? (
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-4">
            <Icon className="w-10 h-10 text-slate-400" />
          </div>
        ) : null}
      </div>

      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>

      {description && (
        <p className="text-slate-600 max-w-md mb-6">{description}</p>
      )}

      {action && (
        <Button
          variant="primary"
          size="md"
          onClick={action.onClick}
          icon={action.icon}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
