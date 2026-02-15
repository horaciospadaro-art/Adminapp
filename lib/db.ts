import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    return new PrismaClient()
}

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const getPrisma = () => {
    if (!globalThis.prismaGlobal) {
        globalThis.prismaGlobal = prismaClientSingleton()
    }
    return globalThis.prismaGlobal
}

// Lazy Proxy to prevent initialization during build-time module evaluation
const prisma = new Proxy({} as any, {
    get(target, prop, receiver) {
        if (prop === 'then') return undefined
        const instance = getPrisma()
        const value = Reflect.get(instance, prop, receiver)
        return typeof value === 'function' ? value.bind(instance) : value
    }
})

export default prisma as PrismaClient

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma as any
