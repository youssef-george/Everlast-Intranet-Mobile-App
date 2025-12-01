import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Clear existing data
    await prisma.typingIndicator.deleteMany();
    await prisma.voiceNote.deleteMany();
    await prisma.reaction.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.message.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();

    // Create only Youssef George user
    const user = await prisma.user.create({
        data: {
            name: 'Youssef George',
            email: 'youssef.george@everlastwellness.com',
            phone: null,
            jobTitle: 'Super Admin',
            department: 'Administration',
            role: 'SUPER_ADMIN',
            accountState: 'ACTIVE',
            isOnline: true,
            profilePicture: null,
        },
    });

    console.log(`✅ Created user: ${user.name} (${user.email})`);
    console.log('🎉 Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
