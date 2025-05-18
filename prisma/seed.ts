import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Delete all existing roles and users first
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // Create default roles with explicit IDs
  const roles = [
    {
      id: 1,
      name: 'viewer',
      description: 'Can only view data, no modification permissions'
    },
    {
      id: 2,
      name: 'editor',
      description: 'Can view, create, update, and delete data'
    }
  ];

  for (const role of roles) {
    await prisma.role.create({
      data: role
    });
  }

  // Create default editor user
  const editorRole = await prisma.role.findUnique({
    where: { name: 'editor' }
  });

  if (editorRole) {
    const hashedPassword = await bcrypt.hash('editor123', 10);
    await prisma.user.create({
      data: {
        username: 'editor',
        email: 'editor@example.com',
        passwordHash: hashedPassword,
        fullName: 'Default Editor',
        roleId: editorRole.id
      }
    });
  }

  console.log('Database has been seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 