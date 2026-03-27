import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
    const normalizedStatus = status.toLowerCase();

    // Mapping status to colors
    let variant: 'success' | 'amber' | 'info' | 'destructive' | 'neutral' = 'neutral';
    let label = status;

    if (normalizedStatus.includes('delivered') || normalizedStatus.includes('approved') || normalizedStatus.includes('success')) {
        variant = 'success';
        label = 'Delivered';
    } else if (normalizedStatus.includes('pending') || normalizedStatus.includes('review')) {
        variant = 'amber';
        label = 'Pending';
    } else if (normalizedStatus.includes('transit') || normalizedStatus.includes('progress') || normalizedStatus.includes('active')) {
        variant = 'info';
        label = 'In Transit';
    } else if (normalizedStatus.includes('hold') || normalizedStatus.includes('customs')) {
        variant = 'amber';
        label = 'Customs Hold';
    } else if (normalizedStatus.includes('failed') || normalizedStatus.includes('rejected') || normalizedStatus.includes('error')) {
        variant = 'destructive';
        label = 'Error';
    }

    return (
        <Badge
            variant={variant}
            className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium uppercase tracking-tight rounded-md border-none",
                variant === 'success' && "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
                variant === 'amber' && "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
                variant === 'info' && "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
                variant === 'destructive' && "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
                className)}
        >
            <span className="w-1 h-1 rounded-full bg-current"></span>
            {label}
        </Badge>
    );
};
