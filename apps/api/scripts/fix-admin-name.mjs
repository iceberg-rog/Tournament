import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const updated = await prisma.user.update({
  where: { email: 'admin@example.com' },
  data: { displayName: 'مدیر سیستم' },
  select: { email: true, displayName: true },
});
console.log('fixed:', updated.email, '→', updated.displayName);
await prisma.$disconnect();
