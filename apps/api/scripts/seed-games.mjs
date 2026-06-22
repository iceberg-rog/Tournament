// seed کاتالوگِ ۴۰ بازیِ معروف در جدول Game. اجرا: node scripts/seed-games.mjs
import { PrismaClient } from '@prisma/client';

const GAMES = [
  ['ea-fc-24', 'EA Sports FC 24', 'ورزشی'],
  ['efootball', 'eFootball', 'ورزشی'],
  ['fifa-23', 'FIFA 23', 'ورزشی'],
  ['rocket-league', 'Rocket League', 'ورزشی'],
  ['nba-2k', 'NBA 2K', 'ورزشی'],
  ['valorant', 'Valorant', 'تیراندازی'],
  ['cs2', 'Counter-Strike 2', 'تیراندازی'],
  ['cod', 'Call of Duty', 'تیراندازی'],
  ['overwatch-2', 'Overwatch 2', 'تیراندازی'],
  ['r6', 'Rainbow Six Siege', 'تیراندازی'],
  ['battlefield', 'Battlefield', 'تیراندازی'],
  ['halo', 'Halo Infinite', 'تیراندازی'],
  ['pubg', 'PUBG: Battlegrounds', 'بتل‌رویال'],
  ['pubg-mobile', 'PUBG Mobile', 'بتل‌رویال'],
  ['warzone', 'Call of Duty: Warzone', 'بتل‌رویال'],
  ['fortnite', 'Fortnite', 'بتل‌رویال'],
  ['apex', 'Apex Legends', 'بتل‌رویال'],
  ['free-fire', 'Free Fire', 'بتل‌رویال'],
  ['cod-mobile', 'Call of Duty: Mobile', 'بتل‌رویال'],
  ['dota-2', 'Dota 2', 'MOBA'],
  ['lol', 'League of Legends', 'MOBA'],
  ['wild-rift', 'LoL: Wild Rift', 'MOBA'],
  ['mobile-legends', 'Mobile Legends', 'MOBA'],
  ['honor-of-kings', 'Honor of Kings', 'MOBA'],
  ['arena-of-valor', 'Arena of Valor', 'MOBA'],
  ['sf6', 'Street Fighter 6', 'مبارزه‌ای'],
  ['tekken-8', 'Tekken 8', 'مبارزه‌ای'],
  ['mk1', 'Mortal Kombat 1', 'مبارزه‌ای'],
  ['smash', 'Super Smash Bros', 'مبارزه‌ای'],
  ['forza', 'Forza Horizon', 'مسابقه‌ای'],
  ['gt7', 'Gran Turismo 7', 'مسابقه‌ای'],
  ['nfs', 'Need for Speed', 'مسابقه‌ای'],
  ['clash-royale', 'Clash Royale', 'استراتژی'],
  ['clash-of-clans', 'Clash of Clans', 'استراتژی'],
  ['hearthstone', 'Hearthstone', 'استراتژی'],
  ['tft', 'Teamfight Tactics', 'استراتژی'],
  ['aoe4', 'Age of Empires IV', 'استراتژی'],
  ['brawl-stars', 'Brawl Stars', 'موبایل/پارتی'],
  ['fall-guys', 'Fall Guys', 'موبایل/پارتی'],
  ['minecraft', 'Minecraft', 'موبایل/پارتی'],
];

const prisma = new PrismaClient();
let n = 0;
for (const [slug, name, category] of GAMES) {
  await prisma.game.upsert({
    where: { slug },
    create: { slug, name, platforms: [category], active: true },
    update: { name, platforms: [category], active: true },
  });
  n++;
}
console.log(`✅ ${n} بازی در کاتالوگ seed شد`);
await prisma.$disconnect();
