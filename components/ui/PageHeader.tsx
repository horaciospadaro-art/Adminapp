import Link from 'next/link'

import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
    title: string
    description?: string
    actionLabel?: string
    actionHref?: string
    onAction?: () => void
    backHref?: string
}

export function PageHeader({ title, description, actionLabel, actionHref, onAction, backHref }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                {backHref && (
                    <Link
                        href={backHref}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                )}
                <div>
                    <h1 className="text-2xl font-bold text-[#393a3d] tracking-tight">{title}</h1>
                    {description && (
                        <p className="text-sm text-gray-500 mt-1">{description}</p>
                    )}
                </div>
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
