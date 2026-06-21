// ارتقای یک کاربر به نقش ADMIN. اجرا: node scripts/make-admin.mjs <email>
import { PrismaClient } from '@prisma/client';

const email = process.argv[2];
if (!email) {
  console.error('usage: node scripts/make-admin.mjs <email>');
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const user = await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
  console.log(`✅ ${user.email} اکنون ${user.role} است`);
} catch (e) {
  console.error('❌', e.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
