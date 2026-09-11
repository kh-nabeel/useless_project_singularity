import React from 'react';
import { Loader2 } from 'lucide-react';

interface BrutalistButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: React.ReactNode;
}

export function BrutalistButton({ isLoading, children, className, ...props }: BrutalistButtonProps) {
  return (
    <button
      className={`brutalist-btn flex items-center justify-center gap-2 px-6 py-4 font-bold ${className || ''}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : children}
    </button>
  );
}
