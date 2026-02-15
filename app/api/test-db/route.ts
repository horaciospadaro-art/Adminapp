
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { DocumentType, PaymentStatus } from '@prisma/client'

export async function GET() {
    try {
        const company = await prisma.company.findFirst()
        if (!company) return NextResponse.json({ error: 'No company found' })

        const thirdParty = await prisma.thirdParty.findFirst()
        if (!thirdParty) return NextResponse.json({ error: 'No third party found' })

        const doc = await prisma.document.create({
            data: {
                company_id: company.id,
                third_party_id: thirdParty.id,
                type: DocumentType.BILL,
                date: new Date(),
                accounting_date: new Date(),
                number: `TEST-${Date.now()}`,
                subtotal: 100,
                tax_amount: 0,
                total: 100,
                balance: 100,
                status: PaymentStatus.PENDING,
                currency_code: 'VED',
                items: {
                    create: [
                        {
                            description: 'Test Item',
                            quantity: 1,
                            unit_price: 100,
                            total: 100,
                            tax_rate: 0,
                            tax_amount: 0
                        }
                    ]
                }
            }
        })

        return NextResponse.json({ success: true, doc_id: doc.id })
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
    }
}
