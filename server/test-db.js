const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        await prisma.$connect();
        console.log('✅ Ansluten till MySQL-databasen');
        
        const count = await prisma.user.count();
        console.log('✅ Hittade', count, 'användare i databasen');
        
        await prisma.$disconnect();
        console.log('✅ Databasanslutning fungerar korrekt!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Fel:', e.message);
        process.exit(1);
    }
}

test();
