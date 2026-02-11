import prisma from '@/lib/db'
import { BankTransactionType, JournalStatus } from '@prisma/client'
import { AccountingEngine } from './accounting-engine'

const accountingEngine = new AccountingEngine()

export const BankService = {
    /**
     * Registra una transacción bancaria y genera automáticamente su asiento contable.
     * La operación es ATÓMICA: si falla el banco o la contabilidad, se revierte todo.
     */
    async createTransaction(data: {
        companyId: string
        bankAccountId: string
        date: Date
        reference: string
        description: string
        amount: number
        type: BankTransactionType
        isIgtfApplied: boolean
        contrapartidaId: string // Cuenta contable seleccionada por el usuario (Gasto/Ingreso/Proveedor)
    }) {
        return await prisma.$transaction(async (tx) => {
            // 1. Obtener datos de la cuenta bancaria para saber su cuenta contable (GL)
            const bankAccount = await tx.bankAccount.findUniqueOrThrow({
                where: { id: data.bankAccountId },
            })

            // 2. Calcular montos
            const amount = Number(data.amount)
            const igtfRate = 0.03
            const igtfAmount = data.isIgtfApplied ? amount * igtfRate : 0

            // 3. Preparar líneas del Asiento Contable
            // Lógica:
            // - Si es DEBIT (Ingreso): Banco DEBE, Contrapartida HABER
            // - Si es CREDIT (Egreso): Banco HABER, Contrapartida DEBE ( + IGTF si aplica)

            const lines = []

            if (data.type === BankTransactionType.DEBIT) {
                // INGRESO DE DINERO (Ej. Cobro a Cliente)
                // 1. Banco (Activo aumenta -> DEBE)
                lines.push({
                    account_id: bankAccount.gl_account_id,
                    debit: amount,
                    credit: 0,
                    description: `Ingreso Ref: ${data.reference}`
                })
                // 2. Contrapartida (Ingreso o Cuenta por Cobrar -> HABER)
                lines.push({
                    account_id: data.contrapartidaId,
                    debit: 0,
                    credit: amount,
                    description: data.description
                })
            } else {
                // EGRESO DE DINERO (Ej. Pago a Proveedor)
                // 1. Banco (Activo disminuye -> HABER)
                // El monto que sale del banco es el total (Base + IGTF si lo cobra el banco ahí mismo)
                // Usualmente el IGTF es un débito aparte, pero aquí simplificamos si es una sola operación.
                // Asumiremos que "amount" es el monto base de la operación.

                // 1. Contrapartida (Gasto o Pasivo disminuye -> DEBE)
                lines.push({
                    account_id: data.contrapartidaId,
                    debit: amount,
                    credit: 0,
                    description: data.description
                })

                // 2. Banco (HABER)
                lines.push({
                    account_id: bankAccount.gl_account_id,
                    debit: 0,
                    credit: amount, // Salida base
                    description: `Egreso Ref: ${data.reference}`
                })

                if (data.isIgtfApplied) {
                    // Buscar cuenta de Gasto IGTF (Debería estar configurada, por ahora buscamos una por código o nombre, o la pasamos como param)
                    // Para MVP, buscaremos una cuenta que se llame "IGTF" o creamos una línea genérica.
                    // MEJORA: Parametrizar cuenta IGTF en Company settings.
                    const igtfAccount = await tx.chartOfAccount.findFirst({
                        where: { company_id: data.companyId, name: { contains: 'IGTF', mode: 'insensitive' } }
                    })

                    if (igtfAccount) {
                        // Gasto IGTF (DEBE)
                        lines.push({
                            account_id: igtfAccount.id,
                            debit: igtfAmount,
                            credit: 0,
                            description: `IGTF 3% Ref: ${data.reference}`
                        })
                        // Salida Banco por IGTF (HABER)
                        lines.push({
                            account_id: bankAccount.gl_account_id,
                            debit: 0,
                            credit: igtfAmount,
                            description: `Débito IGTF Ref: ${data.reference}`
                        })
                    }
                }
            }

            // 4. Crear el Asiento Contable (Journal Entry)
            const journalEntry = await tx.journalEntry.create({
                data: {
                    company_id: data.companyId,
                    date: data.date,
                    number: await accountingEngine.generateCorrelative(data.companyId, data.date, 'B'),
                    description: `Banco ${data.type} - Ref: ${data.reference} - ${data.description}`,
                    status: JournalStatus.POSTED, // Automático = Publicado directo
                    lines: {
                        create: lines
                    }
                }
            })

            // 5. Crear la Transacción Bancaria vinculada
            const bankTransaction = await tx.bankTransaction.create({
                data: {
                    bank_account_id: data.bankAccountId,
                    date: data.date,
                    reference: data.reference,
                    description: data.description,
                    amount: amount,
                    type: data.type,
                    is_igtf_applied: data.isIgtfApplied,
                    igtf_amount: igtfAmount,
                    journal_entry_id: journalEntry.id
                }
            })

            return bankTransaction
        })
    }
}
