
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Cleaning Up Entries on Parent Accounts ---');

    // 1. Get all parent accounts
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

    if (parentAccountIds.length === 0) {
        console.log('No parent accounts found.');
        return;
    }

    // 2. Find journal entry lines linked to these parent accounts
    const invalidLines = await prisma.journalLine.findMany({
        where: {
            account_id: {
                in: parentAccountIds,
            },
        },
        select: {
            entry_id: true,
        },
        distinct: ['entry_id'],
    });

    const entryIdsToDelete = invalidLines.map(line => line.entry_id).filter(id => id !== null);

    console.log(`Found ${entryIdsToDelete.length} journal entries containing lines on parent accounts.`);

    if (entryIdsToDelete.length > 0) {
        console.log('Deleting Entries:', entryIdsToDelete);

        // 3. Delete the Journal Entries (Cascade deletes lines)
        const deleted = await prisma.journalEntry.deleteMany({
            where: {
                id: {
                    in: entryIdsToDelete,
                },
            },
        });

        console.log(`Deleted ${deleted.count} Journal Entries.`);
    } else {
        console.log('No invalid entries found to delete.');
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
