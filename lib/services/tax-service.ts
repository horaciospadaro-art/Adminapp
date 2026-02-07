import prisma from '../db'

export enum TaxType {
    IVA = 'IVA',
    ISLR = 'ISLR',
    IGTF = 'IGTF'
}

export class TaxService {
    private readonly IVA_RATE = 0.16
    private readonly IGTF_RATE = 0.03

    calculateIVA(amount: number): number {
        return amount * this.IVA_RATE
    }

    calculateIGTF(amount: number, isForeignCurrency: boolean): number {
        return isForeignCurrency ? amount * this.IGTF_RATE : 0
    }

    /**
     * Calculates ISLR retention based on provider type and concept.
     * This is a simplified version; real-world requires a rigorous retention table.
     */
    calculateISLR(baseAmount: number, percentage: number): number {
        return baseAmount * (percentage / 100)
    }
}
