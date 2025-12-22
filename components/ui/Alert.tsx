import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  onClose?: () => void;
  icon?: boolean;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  onClose,
  icon = true,
  className = '',
  children,
  ...props
}) => {
  const variantConfig = {
    info: {
      bgClass: 'bg-blue-50 border-blue-200',
      iconClass: 'text-blue-600',
      titleClass: 'text-blue-900',
      textClass: 'text-blue-800',
      Icon: Info,
    },
    success: {
      bgClass: 'bg-success-50 border-success-200',
      iconClass: 'text-success-600',
      titleClass: 'text-success-900',
      textClass: 'text-success-800',
      Icon: CheckCircle2,
    },
    warning: {
      bgClass: 'bg-warning-50 border-warning-200',
      iconClass: 'text-warning-600',
      titleClass: 'text-warning-900',
      textClass: 'text-warning-800',
      Icon: AlertTriangle,
    },
    danger: {
      bgClass: 'bg-danger-50 border-danger-200',
      iconClass: 'text-danger-600',
      titleClass: 'text-danger-900',
      textClass: 'text-danger-800',
      Icon: AlertCircle,
    },
  };

  const config = variantConfig[variant];
  const AlertIcon = config.Icon;

  return (
    <div
      className={`rounded-xl border-2 p-4 ${config.bgClass} ${className}`}
      role="alert"
      {...props}
    >
      <div className="flex gap-3">
        {icon && (
          <div className={`flex-shrink-0 ${config.iconClass}`}>
            <AlertIcon className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`font-semibold mb-1 ${config.titleClass}`}>{title}</h4>
          )}
          <div className={`text-sm ${config.textClass}`}>{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${config.iconClass} hover:opacity-70 transition-opacity`}
            aria-label="Close alert"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
