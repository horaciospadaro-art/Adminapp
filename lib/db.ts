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
        if (!url) {
            // Never initialize without a URL. Return null to handle via Proxy.
            return null
        }
        globalThis.prismaGlobal = new PrismaClient()
    }
    return globalThis.prismaGlobal
}

// Lazy Proxy to prevent initialization during build-time module evaluation
const prisma = new Proxy({} as any, {
    get(target, prop, receiver) {
        // 1. Silent handling for serialization, introspection and symbols
        if (typeof prop === 'symbol') {
            if (prop === Symbol.toStringTag) return 'PrismaClient'
            return undefined
        }

        const silentProps: Record<string, any> = {
            'toJSON': () => '[PrismaClient Proxy]',
            'toString': () => '[PrismaClient Proxy]',
            'inspect': () => '[PrismaClient Proxy]',
            'then': undefined,
            '$$typeof': undefined, // React internal
            'constructor': Object.prototype.constructor
        }

        if (prop in silentProps) return silentProps[prop]

        // 2. Safely get or return null
        const instance = getPrisma()

        if (!instance) {
            // During build without URL, return a dummy object for models/properties
            // so things like `prisma.user.findMany` don't crash
            return new Proxy(() => { }, {
                get: () => prisma, // recursive dummy
                apply: () => {
                    console.warn(`Prisma method ${String(prop)} called during build without DATABASE_URL. Returning empty array/null.`)
                    return Promise.resolve([])
                }
            })
        }

        const value = Reflect.get(instance, prop, receiver)
        return typeof value === 'function' ? value.bind(instance) : value
    }
})

export default prisma as PrismaClient

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma as any
