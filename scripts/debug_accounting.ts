import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Searching for "comision 2" ---');
    const entries = await prisma.journalEntry.findMany({
        where: {
            description: {
                contains: 'comisi', // Broaden search in case of typos
                mode: 'insensitive'
            },
        },
        include: {
            lines: {
                include: {
                    account: true,
                },
            },
        },
    });

    if (entries.length === 0) {
        console.log('No entries found matching "comisi".');
    } else {
        entries.forEach(entry => {
            console.log(`\nEntry ID: ${entry.id}`);
            console.log(`Date: ${entry.date}`);
            console.log(`Description: ${entry.description}`);
            console.log(`Status: ${entry.status}`);
            console.log('Lines:');
            let totalDebit = 0;
            let totalCredit = 0;
            entry.lines.forEach(line => {
                console.log(`  - Account: ${line.account.code} (${line.account.name}) | Debit: ${line.debit} | Credit: ${line.credit}`);
                totalDebit += Number(line.debit);
                totalCredit += Number(line.credit);
            });
            console.log(`  Balance: ${totalDebit} (Dr) - ${totalCredit} (Cr) = ${totalDebit - totalCredit}`);
        });
    }

    console.log('\n--- Checking for Entries on Parent Accounts ---');
    // 1. Get all accounts that are parents (have children)
    const allAccounts = await prisma.chartOfAccount.findMany({
        include: {
            _count: {
                select: { children: true },
            },
        },
    });

    const parentAccountIds = allAccounts
        .filter(a => a._count.children > 0)
        .map(a => a.id);

    console.log(`Found ${parentAccountIds.length} parent accounts.`);

    if (parentAccountIds.length > 0) {
        // 2. Find journal entry lines linked to these parent accounts
        const invalidLines = await prisma.journalLine.findMany({
            where: {
                account_id: {
                    in: parentAccountIds,
                },
            },
            include: {
                account: true,
                entry: true,
            },
        });

        console.log(`Found ${invalidLines.length} lines on parent accounts.`);
        invalidLines.forEach((line, index) => {
            try {
                if (line.entry) {
                    // Check for date existence just in case
                    const dateStr = line.entry.date ? new Date(line.entry.date).toISOString().split('T')[0] : 'NO_DATE';
                    console.log(`  - Entry: ${line.entry.description} (${dateStr}) | Account: ${line.account?.code} | Debit: ${line.debit} | Credit: ${line.credit}`);
                } else {
                    console.log(`  - ORPHAN LINE (No Entry Header) | Account: ${line.account?.code} | Debit: ${line.debit} | Credit: ${line.credit}`);
                }
            } catch (err) {
                console.error(`Error processing line ${index}:`, err);
            }
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
