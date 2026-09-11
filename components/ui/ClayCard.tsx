import { ReactNode } from 'react';

interface ClayCardProps {
  children: ReactNode;
  className?: string;
}

export default function ClayCard({ children, className = '' }: ClayCardProps) {
  return (
    <div className={`clay p-6 ${className}`}>
      {children}
    </div>
  );
}
