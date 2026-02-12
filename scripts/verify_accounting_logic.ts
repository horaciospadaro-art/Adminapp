
import { PrismaClient } from '@prisma/client';
import { AccountingEngine } from '../lib/services/accounting-engine';

const prisma = new PrismaClient();
const accountingEngine = new AccountingEngine();

async function main() {
    console.log('--- Verifying Accounting Logic ---');

    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('No company found.');
        return;
    }

    // 1. Test: Create Entry on Parent Account (Should Fail)
    console.log('\n1. Testing Invalid Entry on Parent Account...');

    // Find a parent account
    const parentAccount = await prisma.chartOfAccount.findFirst({
        where: {
            company_id: company.id,
            children: { some: {} } // Has children
        },
        include: { children: true }
    });

    if (!parentAccount) {
        console.log('No parent account found to test.');
    } else {
        console.log(`Attempting to post to parent account: ${parentAccount.code} (${parentAccount.name})`);

        try {
            await accountingEngine.createJournalEntry({
                companyId: company.id,
                date: new Date(),
                description: 'Test Invalid Entry',
                lines: [
                    {
                        accountCode: parentAccount.code,
                        debit: 100,
                        credit: 0
                    },
                    {
                        accountCode: parentAccount.children[0].code, // Use a child for the other side (assuming it exists and is valid, or just another account)
                        // Actually, finding a valid contra account is better.
                        debit: 0,
                        credit: 100
                    }
                ]
            });
            console.error('❌ FAILED: Entry was created on a parent account!');
        } catch (error: any) {
            if (error.message.includes('Cannot post to parent account')) {
                console.log('✅ SUCCESS: Prevented posting to parent account.');
                console.log(`   Error message: ${error.message}`);
            } else {
                console.error(`❌ FAILED: Startling error but not the expected one: ${error.message}`);
            }
        }
    }

    // 2. Test: Create Valid Entry (Should Success)
    console.log('\n2. Testing Valid Entry on Leaf Account...');

    // Find two leaf accounts
    const leafAccounts = await prisma.chartOfAccount.findMany({
        where: {
            company_id: company.id,
            children: { none: {} } // No children
        },
        take: 2
    });

    if (leafAccounts.length < 2) {
        console.log('Not enough leaf accounts to test.');
    } else {
        const acc1 = leafAccounts[0];
        const acc2 = leafAccounts[1];
        console.log(`Attempting to post to leaf accounts: ${acc1.code} and ${acc2.code}`);

        try {
            const entry = await accountingEngine.createJournalEntry({
                companyId: company.id,
                date: new Date(),
                description: 'Test Valid Entry Visualization',
                lines: [
                    {
                        accountCode: acc1.code,
                        debit: 50,
                        credit: 0
                    },
                    {
                        accountCode: acc2.code,
                        debit: 0,
                        credit: 50
                    }
                ]
            });
            console.log(`✅ SUCCESS: Entry created with ID: ${entry.id}`);
            console.log(`   Number: ${entry.number}`);

            // Allow time for user to see it in UI if they reload
        } catch (error: any) {
            console.error(`❌ FAILED: Could not create valid entry: ${error.message}`);
        }
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
