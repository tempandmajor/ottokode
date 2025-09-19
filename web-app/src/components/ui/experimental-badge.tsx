/**
 * Experimental Badge Component
 * Provides consistent styling for experimental/beta features
 */

import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'experimental' | 'beta' | 'alpha' | 'preview' | 'new';

interface ExperimentalBadgeProps {
  variant?: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
}

const badgeStyles: Record<BadgeVariant, string> = {
  experimental: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
  beta: 'bg-blue-50 text-blue-700 ring-blue-700/10',
  alpha: 'bg-red-50 text-red-700 ring-red-700/10',
  preview: 'bg-purple-50 text-purple-700 ring-purple-700/10',
  new: 'bg-green-50 text-green-700 ring-green-700/10'
};

const badgeLabels: Record<BadgeVariant, string> = {
  experimental: 'Experimental',
  beta: 'Beta',
  alpha: 'Alpha',
  preview: 'Preview',
  new: 'New'
};

export function ExperimentalBadge({
  variant = 'experimental',
  children,
  className
}: ExperimentalBadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset';
  const variantClasses = badgeStyles[variant];

  return (
    <span className={cn(baseClasses, variantClasses, className)}>
      {children || badgeLabels[variant]}
    </span>
  );
}

export default ExperimentalBadge;