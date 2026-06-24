// Seed — اکانت‌های پیش‌فرض برای راه‌اندازی روی هر سیستم.
// اجرا:  npm run seed -w @tournament/api   (یا  npx prisma db seed)
// پسوردها برای محیطِ توسعه‌اند؛ در پروداکشن تغییرشان دهید.
import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

const USERS = [
  { email: 'admin@example.com', password: 'admin12345', displayName: 'مدیر سیستم', role: 'ADMIN' },
  { email: 'organizer@example.com', password: 'organizer12345', displayName: 'برگزارکننده‌ی نمونه', role: 'ORGANIZER' },
  { email: 'referee@example.com', password: 'referee12345', displayName: 'داورِ نمونه', role: 'REFEREE' },
  { email: 'player1@example.com', password: 'player12345', displayName: 'بازیکن ۱', role: 'USER' },
  { email: 'player2@example.com', password: 'player12345', displayName: 'بازیکن ۲', role: 'USER' },
];

async function main() {
  for (const u of USERS) {
    const passwordHash = await hash(u.password);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { displayName: u.displayName, role: u.role, passwordHash },
      create: { email: u.email, passwordHash, displayName: u.displayName, role: u.role },
    });
    // کیفِ پول (در صورت نبود)
    await prisma.wallet.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
    console.log(`✅ ${u.email}  (${u.role})  — پسورد: ${u.password}`);
  }
  console.log('\n🎯 برای پنلِ مدیریت با admin@example.com / admin12345 وارد شوید → /admin');
  console.log('   داده‌ی FC26 (۱۲۸ نفره) سمتِ کلاینت mock است و با بازکردنِ /admin/tournaments/t7 ساخته می‌شود.');
}

main()
  .catch((e) => { console.error('❌ seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
