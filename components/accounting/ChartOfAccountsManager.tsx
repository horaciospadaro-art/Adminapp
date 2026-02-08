'use client'

import { useState } from 'react'
import { AccountForm } from '@/components/accounting/AccountForm'
import { AccountTree } from '@/components/accounting/AccountTree'
import { AccountType } from '@prisma/client'

type Account = {
    id: string
    code: string
    name: string
    type: AccountType // Use prisma enum
    parent_id: string | null
    balance: number
}

export function ChartOfAccountsManager({ companyId }: { companyId: string }) {
    const [editingAccount, setEditingAccount] = useState<Account | null>(null)

    const handleEdit = (account: any) => {
        // Ensure account matches expected type or partial
        setEditingAccount(account)
    }

    const handleCancelEdit = () => {
        setEditingAccount(null)
    }

    const handleSuccess = () => {
        setEditingAccount(null)
        // Refresh? AccountTree handles its own fetch, but we might need to trigger reload.
        // AccountForm refreshes router, which refreshes server components.
        // AccountTree is client side fetch. It needs a trigger.
        // For now, let's rely on router.refresh() if AccountTree was using server data, but it uses client fetch.
        // We need to trigger AccountTree refresh.
        // Passing a key or refresh signal.
        window.location.reload() // Brute force for now, or better:
        // Pass a refreshKey to AccountTree
    }

    // Better approach: Lift state or use router refresh if AccountTree used server data. 
    // Since AccountTree uses client fetch, router.refresh() won't affect it unless we change how it fetches or re-mount it.
    // Let's use a simple key for now to force re-mount.
    const [refreshKey, setRefreshKey] = useState(0)

    const onFormSuccess = () => {
        setEditingAccount(null)
        setRefreshKey(prev => prev + 1)
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
                <AccountForm
                    companyId={companyId}
                    initialData={editingAccount}
                    onCancel={handleCancelEdit}
                    onSuccess={onFormSuccess}
                />
            </div>
            <div>
                <AccountTree
                    key={refreshKey}
                    companyId={companyId}
                    onEdit={handleEdit}
                />
            </div>
        </div>
    )
}
