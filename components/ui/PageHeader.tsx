import Link from 'next/link'

interface PageHeaderProps {
    title: string
    description?: string
    actionLabel?: string
    actionHref?: string
    onAction?: () => void
}

export function PageHeader({ title, description, actionLabel, actionHref, onAction }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl font-bold text-[#393a3d] tracking-tight">{title}</h1>
                {description && (
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                )}
            </div>

            {actionLabel && (
                actionHref ? (
                    <Link
                        href={actionHref}
                        className="bg-[#2ca01c] hover:bg-[#248217] text-white font-semibold py-2 px-6 rounded-full transition-colors shadow-sm text-sm"
                    >
                        {actionLabel}
                    </Link>
                ) : (
                    <button
                        onClick={onAction}
                        className="bg-[#2ca01c] hover:bg-[#248217] text-white font-semibold py-2 px-6 rounded-full transition-colors shadow-sm text-sm"
                    >
                        {actionLabel}
                    </button>
                )
            )}
        </div>
    )
}
