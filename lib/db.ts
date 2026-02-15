import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    return new PrismaClient()
}

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const getPrisma = () => {
    if (!globalThis.prismaGlobal) {
        const url = process.env.DATABASE_URL || process.env.DIRECT_URL

        // If NO URL is present, we are likely in a build environment without secrets.
        // Return null to trigger the Dummy Proxy.
        if (!url || url === 'undefined' || url === 'null') {
            return null
        }

        // If URL IS present, we MUST initialize. If it fails, let it crash!
        // Do NOT try/catch here, or we hide DB connection errors and return empty data (Silent Data Loss).
        globalThis.prismaGlobal = new PrismaClient({
            datasourceUrl: url
        })
    }
    return globalThis.prismaGlobal
}

const silentProps: Record<string, any> = {
    'toJSON': () => '[PrismaClient Proxy]',
    'toString': () => '[PrismaClient Proxy]',
    'inspect': () => '[PrismaClient Proxy]',
    'then': undefined,
    '$$typeof': undefined, // React internal
    'constructor': Object.prototype.constructor
}

const createDummy = (name: string): any => {
    return new Proxy(() => { }, {
        get(target, prop) {
            if (typeof prop === 'symbol') {
                if (prop === Symbol.toStringTag) return 'PrismaClientDummy'
                return undefined
            }
            if (prop in silentProps) return silentProps[prop]
            return createDummy(`${name}.${String(prop)}`)
        },
        apply() {
            console.warn(`Prisma method ${name} called during build without DATABASE_URL. Returning dummy.`);
            return Promise.resolve([])
        }
    })
}

// Lazy Proxy to prevent initialization during build-time module evaluation
const prisma = new Proxy({} as any, {
    get(target, prop, receiver) {
        if (typeof prop === 'symbol') {
            if (prop === Symbol.toStringTag) return 'PrismaClient'
            return undefined
        }

        if (prop in silentProps) return silentProps[prop]

        const instance = getPrisma()

        if (!instance) {
            return createDummy(String(prop))
        }

        const value = Reflect.get(instance, prop, receiver)
        return typeof value === 'function' ? value.bind(instance) : value
    }
})

export default prisma as PrismaClient

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma as any
