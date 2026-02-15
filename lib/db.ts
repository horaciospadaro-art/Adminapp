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
        if (!url && process.env.NODE_ENV === 'production') {
            // In production build, if URL is missing, we might be in static generation
            // We return a mock to prevent initialization crash
            return null
        }
        globalThis.prismaGlobal = new PrismaClient()
    }
    return globalThis.prismaGlobal
}

// Lazy Proxy to prevent initialization during build-time module evaluation
const prisma = new Proxy({} as any, {
    get(target, prop, receiver) {
        // Prevent initialization for serialization/introspection
        if (prop === 'toJSON' || prop === 'toString') return () => '[PrismaClient Proxy]'
        if (prop === 'then') return undefined

        const instance = getPrisma()
        if (!instance) {
            // If we returned a mock, handle access to properties
            console.warn(`Prisma accessed during build but no DATABASE_URL found. Property: ${String(prop)}`)
            return undefined
        }

        const value = Reflect.get(instance, prop, receiver)
        return typeof value === 'function' ? value.bind(instance) : value
    }
})

export default prisma as PrismaClient

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma as any
