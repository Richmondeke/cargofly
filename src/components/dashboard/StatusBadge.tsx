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
    } else if (normalizedStatus.includes('pending') || normalizedStatus.includes('review')) {
        variant = 'amber';
    } else if (normalizedStatus.includes('transit') || normalizedStatus.includes('progress') || normalizedStatus.includes('active')) {
        variant = 'info';
    } else if (normalizedStatus.includes('hold') || normalizedStatus.includes('customs')) {
        // Purple/Special variants can be added later if needed, for now amber or warning
        variant = 'amber';
    } else if (normalizedStatus.includes('failed') || normalizedStatus.includes('rejected') || normalizedStatus.includes('error')) {
        variant = 'destructive';
    }

    // Handle specific label mappings if needed
    if (normalizedStatus === 'in_transit') {
        label = 'In Transit';
    }

    return (
        <Badge
            variant={variant}
            className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg", className)}
        >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
            {label}
        </Badge>
    );
};
