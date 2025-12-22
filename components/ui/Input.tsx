import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  success,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const hasError = Boolean(error);
  const hasSuccess = Boolean(success);

  const inputClasses = `
    w-full px-4 py-2.5 rounded-xl border-2 transition-all duration-200
    placeholder:text-slate-400
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:bg-slate-50 disabled:cursor-not-allowed
    ${leftIcon ? 'pl-11' : ''}
    ${rightIcon || hasError || hasSuccess ? 'pr-11' : ''}
    ${hasError ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/20' : ''}
    ${hasSuccess ? 'border-success-300 focus:border-success-500 focus:ring-success-500/20' : ''}
    ${!hasError && !hasSuccess ? 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/20' : ''}
  `;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {props.required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          className={`${inputClasses} ${className}`}
          {...props}
        />
        {hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-danger-500">
            <AlertCircle className="w-5 h-5" />
          </div>
        )}
        {hasSuccess && !hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        )}
        {rightIcon && !hasError && !hasSuccess && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-danger-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
      {success && !error && (
        <p className="mt-1.5 text-sm text-success-600 flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4" />
          {success}
        </p>
      )}
      {helperText && !error && !success && (
        <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
      )}
    </div>
  );
};

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const hasError = Boolean(error);

  const textareaClasses = `
    w-full px-4 py-2.5 rounded-xl border-2 transition-all duration-200
    placeholder:text-slate-400
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:bg-slate-50 disabled:cursor-not-allowed
    resize-none
    ${hasError ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/20' : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/20'}
  `;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {props.required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        className={`${textareaClasses} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-danger-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
      )}
    </div>
  );
};
