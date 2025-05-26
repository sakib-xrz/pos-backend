import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password for admin user
  const hashedPassword = await bcrypt.hash('123456', 12);

  // Create admin user
  await prisma.user.upsert({
    where: { email: 'superadmin@pos.com' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'superadmin@pos.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Login Credentials:');
  console.log('Super Admin - Email: superadmin@pos.com, Password: 123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
