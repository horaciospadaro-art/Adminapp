import { AccountService } from '../lib/services/account-service'

async function main() {
    console.log('--- Iniciando Pruebas de Lógica de Cuentas ---')

    const cases = [
        { input: '1111', expected: '1.1.01.00001' },
        { input: '1.1.1.1', expected: '1.1.01.00001' },
        { input: '2.0.01.00005', expected: '2.0.01.00005' },
        { input: '1', expected: '1' },
        { input: '1.1', expected: '1.1' },
        { input: '1.1.1', expected: '1.1.01' }
    ]

    console.log('\nPruebas de Formato:')
    for (const c of cases) {
        try {
            const result = AccountService.formatCode(c.input)
            const passed = result === c.expected
            console.log(`Input: ${c.input.padEnd(10)} | Output: ${result.padEnd(12)} | Expected: ${c.expected.padEnd(12)} | ${passed ? '✅' : '❌'}`)
        } catch (e: any) {
            console.log(`Input: ${c.input.padEnd(10)} | Error: ${e.message} | ❌`)
        }
    }

    console.log('\nPruebas de Estructura:')
    const structureCases = [
        { code: '1', level: 1, parent: null },
        { code: '1.1', level: 2, parent: '1' },
        { code: '1.1.01', level: 3, parent: '1.1' },
        { code: '1.1.01.00001', level: 4, parent: '1.1.01' }
    ]

    for (const c of structureCases) {
        const level = AccountService.getLevel(c.code)
        const parent = AccountService.getParentCode(c.code)
        const passed = level === c.level && parent === c.parent
        console.log(`Code: ${c.code.padEnd(12)} | Level: ${level} (Exp: ${c.level}) | Parent: ${parent} (Exp: ${c.parent}) | ${passed ? '✅' : '❌'}`)
    }

    console.log('\n--- Fin de Pruebas ---')
}

main().catch(console.error)
