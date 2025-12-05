import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  // Use 12 rounds to match authService.ts
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@myrobin.com' },
    update: {
      password: adminPassword, // Update password if user exists
    },
    create: {
      email: 'admin@myrobin.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      drivingLicenceNumber: 'ADMIN123',
    },
  });

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      password: userPassword, // Update password if user exists
    },
    create: {
      email: 'user@example.com',
      password: userPassword,
      name: 'Test User',
      role: 'USER',
      drivingLicenceNumber: 'USER123',
    },
  });

  console.log('✅ Seeded users:');
  console.log('  Admin:', admin.email, '- Password: admin123');
  console.log('  User:', user.email, '- Password: user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
