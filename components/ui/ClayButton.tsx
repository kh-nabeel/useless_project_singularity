import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ClayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export default function ClayButton({ children, className = '', ...props }: ClayButtonProps) {
  return (
    <button
      className={`clay-btn rounded-2xl font-semibold text-[#5c4a3a] active:scale-95 transition-transform ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
