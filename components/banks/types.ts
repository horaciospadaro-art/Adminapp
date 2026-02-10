
export type BankAccount = {
    id: string
    bank_name: string
    account_number: string
    currency: string
    balance: number
    company_id: string
}

export type Document = {
    id: string
    number: string
    date: string
    total: number
    balance: number
    third_party: {
        id: string
        name: string
        rif: string
    }
}

export type PaymentAllocation = {
    documentId: string
    amount: number
}
