export interface GameDef {
  slug: string;
  name: string;
  category: string;
  emoji: string;
  c1: string; // رنگِ برندِ ۱
  c2: string; // رنگِ برندِ ۲
}

/** کاتالوگِ ۴۰ بازیِ معروف با دسته‌بندی و رنگِ برند برای کاورِ حرفه‌ای. */
export const GAMES: GameDef[] = [
  // ⚽ ورزشی
  { slug: 'ea-fc-26', name: 'EA Sports FC 26', category: 'ورزشی', emoji: '⚽', c1: '#00d35a', c2: '#003b1f' },
  { slug: 'ea-fc-25', name: 'EA Sports FC 25', category: 'ورزشی', emoji: '⚽', c1: '#00b140', c2: '#04301c' },
  { slug: 'efootball', name: 'eFootball 2026', category: 'ورزشی', emoji: '⚽', c1: '#1e90ff', c2: '#0a2a66' },
  { slug: 'rocket-league', name: 'Rocket League', category: 'ورزشی', emoji: '🚗', c1: '#1f8fff', c2: '#f5a623' },
  { slug: 'nba-2k', name: 'NBA 2K', category: 'ورزشی', emoji: '🏀', c1: '#c8102e', c2: '#1d1d1d' },

  // 🔫 تیراندازی
  { slug: 'valorant', name: 'Valorant', category: 'تیراندازی', emoji: '🎯', c1: '#fd4556', c2: '#0f1923' },
  { slug: 'cs2', name: 'Counter-Strike 2', category: 'تیراندازی', emoji: '🔫', c1: '#de9b35', c2: '#1b2838' },
  { slug: 'cod', name: 'Call of Duty', category: 'تیراندازی', emoji: '🪖', c1: '#6b7a3a', c2: '#0a0a0a' },
  { slug: 'overwatch-2', name: 'Overwatch 2', category: 'تیراندازی', emoji: '🧡', c1: '#f99e1a', c2: '#43484c' },
  { slug: 'r6', name: 'Rainbow Six Siege', category: 'تیراندازی', emoji: '🛡️', c1: '#1b6ec2', c2: '#0a0a0a' },
  { slug: 'battlefield', name: 'Battlefield', category: 'تیراندازی', emoji: '💥', c1: '#00a8e1', c2: '#1a1a1a' },
  { slug: 'halo', name: 'Halo Infinite', category: 'تیراندازی', emoji: '👽', c1: '#2e7d32', c2: '#0b1e2d' },

  // 🪂 بتل‌رویال
  { slug: 'pubg', name: 'PUBG: Battlegrounds', category: 'بتل‌رویال', emoji: '🪂', c1: '#f2a900', c2: '#2d2d2d' },
  { slug: 'pubg-mobile', name: 'PUBG Mobile', category: 'بتل‌رویال', emoji: '📱', c1: '#f2a900', c2: '#1f1f1f' },
  { slug: 'warzone', name: 'Call of Duty: Warzone', category: 'بتل‌رویال', emoji: '🪂', c1: '#f5a623', c2: '#141414' },
  { slug: 'fortnite', name: 'Fortnite', category: 'بتل‌رویال', emoji: '🛠️', c1: '#7b2ff7', c2: '#2575fc' },
  { slug: 'apex', name: 'Apex Legends', category: 'بتل‌رویال', emoji: '🟥', c1: '#da292a', c2: '#2b2b2b' },
  { slug: 'free-fire', name: 'Free Fire', category: 'بتل‌رویال', emoji: '🔥', c1: '#ff7a00', c2: '#1a1a1a' },
  { slug: 'cod-mobile', name: 'Call of Duty: Mobile', category: 'بتل‌رویال', emoji: '📲', c1: '#6b7a3a', c2: '#141414' },

  // ⚔️ MOBA
  { slug: 'dota-2', name: 'Dota 2', category: 'MOBA', emoji: '🗡️', c1: '#a02b1f', c2: '#1b1b1b' },
  { slug: 'lol', name: 'League of Legends', category: 'MOBA', emoji: '⚔️', c1: '#c89b3c', c2: '#0a1428' },
  { slug: 'wild-rift', name: 'LoL: Wild Rift', category: 'MOBA', emoji: '⚔️', c1: '#c89b3c', c2: '#091428' },
  { slug: 'mobile-legends', name: 'Mobile Legends', category: 'MOBA', emoji: '🛡️', c1: '#1e90ff', c2: '#0a1a3f' },
  { slug: 'honor-of-kings', name: 'Honor of Kings', category: 'MOBA', emoji: '👑', c1: '#d4af37', c2: '#1a1a2e' },
  { slug: 'arena-of-valor', name: 'Arena of Valor', category: 'MOBA', emoji: '⚔️', c1: '#e63946', c2: '#1d3557' },

  // 🥊 مبارزه‌ای
  { slug: 'sf6', name: 'Street Fighter 6', category: 'مبارزه‌ای', emoji: '🥊', c1: '#ffcc00', c2: '#c1121f' },
  { slug: 'tekken-8', name: 'Tekken 8', category: 'مبارزه‌ای', emoji: '👊', c1: '#e63946', c2: '#0a0a0a' },
  { slug: 'mk1', name: 'Mortal Kombat 1', category: 'مبارزه‌ای', emoji: '🐉', c1: '#f5a623', c2: '#1a0000' },
  { slug: 'smash', name: 'Super Smash Bros', category: 'مبارزه‌ای', emoji: '💥', c1: '#e60012', c2: '#1a1a1a' },

  // 🏁 مسابقه‌ای
  { slug: 'forza', name: 'Forza Horizon', category: 'مسابقه‌ای', emoji: '🏎️', c1: '#7b2ff7', c2: '#e91e63' },
  { slug: 'gt7', name: 'Gran Turismo 7', category: 'مسابقه‌ای', emoji: '🏁', c1: '#005bea', c2: '#00c6fb' },
  { slug: 'nfs', name: 'Need for Speed', category: 'مسابقه‌ای', emoji: '🏎️', c1: '#ff512f', c2: '#dd2476' },

  // ♟️ استراتژی / کارتی
  { slug: 'clash-royale', name: 'Clash Royale', category: 'استراتژی', emoji: '👑', c1: '#1e90ff', c2: '#0a1a3f' },
  { slug: 'clash-of-clans', name: 'Clash of Clans', category: 'استراتژی', emoji: '⚔️', c1: '#e8a317', c2: '#5a3d1f' },
  { slug: 'hearthstone', name: 'Hearthstone', category: 'استراتژی', emoji: '🃏', c1: '#d4820a', c2: '#2b1a0a' },
  { slug: 'tft', name: 'Teamfight Tactics', category: 'استراتژی', emoji: '♟️', c1: '#c89b3c', c2: '#0a1428' },
  { slug: 'aoe4', name: 'Age of Empires IV', category: 'استراتژی', emoji: '🏰', c1: '#b8860b', c2: '#2b1a0a' },

  // 🎉 موبایل / پارتی
  { slug: 'brawl-stars', name: 'Brawl Stars', category: 'موبایل/پارتی', emoji: '💫', c1: '#ffb300', c2: '#7b2ff7' },
  { slug: 'fall-guys', name: 'Fall Guys', category: 'موبایل/پارتی', emoji: '🫘', c1: '#ff6fb5', c2: '#7b2ff7' },
  { slug: 'minecraft', name: 'Minecraft', category: 'موبایل/پارتی', emoji: '🟩', c1: '#5d8f3a', c2: '#3b2a1a' },
];

export const GAME_CATEGORIES = ['ورزشی', 'تیراندازی', 'بتل‌رویال', 'MOBA', 'مبارزه‌ای', 'مسابقه‌ای', 'استراتژی', 'موبایل/پارتی'];

export function findGame(name?: string): GameDef | undefined {
  if (!name) return undefined;
  const n = name.toLowerCase();
  return GAMES.find((g) => g.name.toLowerCase() === n) ?? GAMES.find((g) => n.includes(g.slug.replace(/-/g, ' ')) || g.name.toLowerCase().includes(n) || n.includes(g.name.toLowerCase()));
}

/** فرمت‌های پیشنهادی برای هر دسته‌ی بازی. */
export const RECOMMENDED_FORMATS: Record<string, string[]> = {
  ورزشی: ['SINGLE_ELIM', 'DOUBLE_ELIM', 'ROUND_ROBIN'],
  تیراندازی: ['SINGLE_ELIM', 'DOUBLE_ELIM', 'SWISS'],
  'بتل‌رویال': ['FFA', 'SWISS'],
  MOBA: ['SINGLE_ELIM', 'DOUBLE_ELIM', 'SWISS'],
  'مبارزه‌ای': ['DOUBLE_ELIM', 'SINGLE_ELIM'],
  'مسابقه‌ای': ['FFA', 'ROUND_ROBIN'],
  استراتژی: ['SWISS', 'SINGLE_ELIM'],
  'موبایل/پارتی': ['FFA', 'SINGLE_ELIM'],
};

export function recommendedFormats(game?: string): string[] {
  const g = findGame(game);
  return g ? RECOMMENDED_FORMATS[g.category] ?? [] : [];
}
