/**
 * Skapar en testanvändare i databasen
 * Kör: node skapa-testanvandare.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@demo.se';
  const password = 'demo123';
  
  try {
    // Kolla om användaren redan finns
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      console.log('Användaren finns redan. Uppdaterar lösenord...');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      });
      
      console.log('✅ Lösenord uppdaterat!');
    } else {
      console.log('Skapar ny testanvändare...');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: 'Demo',
          lastName: 'Användare',
          role: 'USER',
        },
      });
      
      // Skapa tom CV-post
      await prisma.cV.create({
        data: {
          userId: user.id,
        },
      });
      
      console.log('✅ Testanvändare skapad!');
    }
    
    console.log('');
    console.log('Inloggningsuppgifter:');
    console.log('  E-post: demo@demo.se');
    console.log('  Lösenord: demo123');
    
  } catch (error) {
    console.error('Fel:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
