import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password for admin user
  const hashedPassword = await bcrypt.hash('123456', 12);

  // Create admin user
  await prisma.user.upsert({
    where: { email: 'admin@pos.com' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@pos.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // Create a staff user for testing
  await prisma.user.upsert({
    where: { email: 'staff@pos.com' },
    update: {},
    create: {
      name: 'Staff Member',
      email: 'staff@pos.com',
      password: hashedPassword, // same password for testing
      role: 'STAFF',
    },
  });

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Login Credentials:');
  console.log('Admin - Email: admin@pos.com, Password: 123456');
  console.log('Staff - Email: staff@pos.com, Password: 123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
