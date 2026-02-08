import prisma from '@/lib/db'
import { AccountType, ChartOfAccount } from '@prisma/client'

export class AccountService {

    /**
     * Aplica la máscara X.X.XX.XXXXX dinámicamente al input
     * Retorna el string formateado hasta donde se haya escrito.
     */
    static maskAccountCode(value: string): string {
        // 1. Limpiar todo lo que no sea número
        const digits = value.replace(/\D/g, '')

        // 2. Limitar a 9 dígitos (1+1+2+5)
        const limited = digits.slice(0, 9)

        // 3. Construir el string con puntos
        let masked = ''
        if (limited.length > 0) {
            masked += limited.substring(0, 1) // Nivel 1 (1 dígito)
        }
        if (limited.length > 1) {
            masked += '.' + limited.substring(1, 2) // Nivel 2 (1 dígito)
        }
        if (limited.length > 2) {
            masked += '.' + limited.substring(2, 4) // Nivel 3 (2 dígitos)
        }
        if (limited.length > 4) {
            masked += '.' + limited.substring(4, 9) // Nivel 4 (5 dígitos)
        }

        return masked
    }

    /**
     * Formatea un código de cuenta completo (rellena ceros si faltan)
     * Ejemplos:
     * "1.1.1.1" -> "1.1.01.00001"
     */
    static formatCode(input: string): string {
        const cleanInput = input.replace(/[^0-9.]/g, '')
        const parts = cleanInput.split('.')

        // ... rest of logic relies on parts logic, but let's keep it robust
        // This method assumes the input might have dots already or be raw.
        // If it's raw 1101, valid formatCode might fail if it expects dots to split hierarchy.
        // But maskAccountCode is for input typing. formatCode is for validation/storage.

        // Let's keep original formatCode logic but ensure it handles what maskAccountCode produces.
        // maskAccountCode produces "1.1.01" so formatCode should handle that.

        if (parts.length > 4) throw new Error('El código excede los 4 niveles jerárquicos.')

        // ... existing validation logic ...
        // Re-implementing specifically to ensure consistency with what I see in the file content

        // Nivel 1: Jerarquía Mayor (1 dígito)
        if (parts[0] && parts[0].length > 1) throw new Error('Nivel 1 (Clase) debe tener 1 dígito.')

        // Nivel 2: Grupo (1 dígito)
        if (parts[1] && parts[1].length > 1) throw new Error('Nivel 2 (Grupo) debe tener 1 dígito.')

        // Nivel 3: Sub-grupo (2 dígitos)
        let part3 = parts[2]
        if (part3) {
            if (part3.length > 2) throw new Error('Nivel 3 (Sub-grupo) debe tener 2 dígitos como máximo.')
            part3 = part3.padStart(2, '0')
        }

        // Nivel 4: Cuenta (5 dígitos)
        let part4 = parts[3]
        if (part4) {
            if (part4.length > 5) throw new Error('Nivel 4 (Cuenta) debe tener 5 dígitos como máximo.')
            part4 = part4.padStart(5, '0')
        }

        // Reconstruir
        const formattedParts = [parts[0], parts[1], part3, part4].filter(p => p !== undefined && p !== '')
        return formattedParts.join('.')
    }

    /**
     * Determina el nivel de la cuenta basado en su código formateado
     */
    static getLevel(code: string): number {
        return code.split('.').length
    }

    /**
     * Obtiene el código del padre
     * Ej: "1.1.01.00001" -> "1.1.01"
     */
    static getParentCode(code: string): string | null {
        const parts = code.split('.')
        if (parts.length === 1) return null
        return parts.slice(0, parts.length - 1).join('.')
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
            orderBy: { code: 'asc' }
        })
        return accounts
    }
}
