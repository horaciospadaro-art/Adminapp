import prisma from '@/lib/db'
import { AccountType, ChartOfAccount } from '@prisma/client'
import {
    formatAccountCode,
    getAccountLevel,
    getParentAccountCode,
    maskAccountCode
} from '@/lib/utils/account-utils'

export class AccountService {

    /**
     * Aplica la máscara X.X.XX.XXXXX dinámicamente al input
     */
    static maskAccountCode(value: string): string {
        return maskAccountCode(value)
    }

    /**
     * Formatea un código de cuenta completo (rellena ceros si faltan)
     */
    static formatCode(input: string): string {
        return formatAccountCode(input)
    }

    /**
     * Determina el nivel de la cuenta basado en su código formateado
     */
    static getLevel(code: string): number {
        return getAccountLevel(code)
    }

    /**
     * Obtiene el código del padre
     */
    static getParentCode(code: string): string | null {
        return getParentAccountCode(code)
    }

    /**
     * Verifica si la cuenta puede recibir movimientos (Solo nivel 4)
     */
    static isMovementAllowed(code: string): boolean {
        return this.getLevel(code) === 4
    }

    /**
     * Crea una nueva cuenta con validaciones
     */
    async createAccount(data: {
        companyId: string,
        rawCode: string,
        name: string,
        type: AccountType
    }) {
        const formattedCode = AccountService.formatCode(data.rawCode)
        const level = AccountService.getLevel(formattedCode)
        const parentCode = AccountService.getParentCode(formattedCode)

        // 1. Validar unicidad
        const existing = await prisma.chartOfAccount.findUnique({
            where: {
                company_id_code: {
                    company_id: data.companyId,
                    code: formattedCode
                }
            }
        })

        if (existing) {
            throw new Error(`La cuenta con código ${formattedCode} ya existe.`)
        }

        // 2. Validar Padre
        let parentId: string | null = null
        if (parentCode) {
            const parent = await prisma.chartOfAccount.findUnique({
                where: {
                    company_id_code: {
                        company_id: data.companyId,
                        code: parentCode
                    }
                }
            })

            if (!parent) {
                throw new Error(`No se puede crear la cuenta ${formattedCode} porque su cuenta madre ${parentCode} no existe.`)
            }
            parentId = parent.id
        } else {
            // Si es nivel 1, no tiene padre.
            if (level > 1) {
                throw new Error(`Error lógico: Cuenta de nivel ${level} debería tener padre.`)
            }
        }

        // 3. Crear
        return await prisma.chartOfAccount.create({
            data: {
                company_id: data.companyId,
                code: formattedCode,
                name: data.name,
                type: data.type,
                parent_id: parentId
            }
        })
    }

    /**
     * Obtiene el árbol de cuentas
     */
    async getAccountTree(companyId: string) {
        const accounts = await prisma.chartOfAccount.findMany({
            where: { company_id: companyId },
            orderBy: { code: 'asc' },
            include: {
                _count: {
                    select: { children: true }
                }
            }
        })
        return accounts
    }
}
