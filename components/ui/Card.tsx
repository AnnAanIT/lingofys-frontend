import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'glass';
  hover?: boolean;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  hover = false,
  interactive = false,
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'bg-white rounded-2xl transition-all duration-300';

  const variantClasses = {
    default: 'border border-slate-200',
    bordered: 'border-2 border-slate-300',
    elevated: 'shadow-soft-lg',
    glass: 'bg-white/80 backdrop-blur-sm border border-slate-200/50',
  };

  const hoverClasses = hover ? 'hover:shadow-soft-lg hover:-translate-y-1' : '';
  const interactiveClasses = interactive ? 'cursor-pointer active:scale-[0.98]' : '';

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`px-6 py-5 border-b border-slate-100 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <h3 className={`text-lg font-semibold text-slate-900 ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <p className={`text-sm text-slate-600 mt-1 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`px-6 py-5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl ${className}`} {...props}>
    {children}
  </div>
);
