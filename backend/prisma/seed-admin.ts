import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding super admin...');

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: 'youssef.george@everlastwellness.com' },
  });

  if (existingUser) {
    console.log('✅ Super admin already exists!');
    console.log('User:', existingUser);
    return;
  }

  // Create super admin
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Youssef George',
      email: 'youssef.george@everlastwellness.com',
      jobTitle: 'Super Administrator',
      department: 'IT & Administration',
      role: 'SUPER_ADMIN',
      accountState: 'ACTIVE',
      isOnline: false,
    },
  });

  console.log('✅ Super admin created successfully!');
  console.log('Email:', superAdmin.email);
  console.log('Name:', superAdmin.name);
  console.log('Role:', superAdmin.role);
  console.log('ID:', superAdmin.id);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

