import Image from 'next/image';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    imageSrc?: string;
    action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon,
    imageSrc = "/images/illustrations/courier_plane.jpg",
    action
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {imageSrc ? (
                <div className="w-64 h-64 relative mb-6 rounded-2xl overflow-hidden opacity-90 grayscale-[20%] dark:opacity-80">
                    <Image
                        src={imageSrc}
                        alt={title}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-background-dark via-transparent to-transparent opacity-60" />
                </div>
            ) : icon ? (
                <div className="mb-4 text-4xl text-primary">{icon}</div>
            ) : null}

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
                    {description}
                </p>
            )}
            {action && (
                <div className="mt-2 text-primary font-bold">
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
