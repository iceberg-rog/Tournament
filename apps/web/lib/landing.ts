// داده و تایپ‌های صفحه‌ی فرود (همه data-driven؛ هیچ عددِ fake).

export type TournamentStatus = 'registration_open' | 'ongoing' | 'finished';
export type TournamentFormat =
  | 'single_elimination'
  | 'double_elimination'
  | 'league'
  | 'swiss'
  | 'battle_royale';
export type Platform = 'PC' | 'Console' | 'Mobile' | 'Cross-play';

export const STATUS_LABEL: Record<TournamentStatus, string> = {
  registration_open: 'در حال ثبت‌نام',
  ongoing: 'زنده',
  finished: 'پایان‌یافته',
};

/** نگاشتِ وضعیت/پلتفرمِ خامِ API به تایپ‌های عمومیِ لندینگ. */
export function mapStatus(s: string): TournamentStatus {
  if (s === 'DRAFT') return 'registration_open';
  if (s === 'RUNNING') return 'ongoing';
  return 'finished';
}
export function mapPlatform(p?: string): Platform {
  if (!p || p === 'PC') return 'PC';
  if (p === 'MOBILE') return 'Mobile';
  if (p === 'CROSS') return 'Cross-play';
  return 'Console';
}

// ───────── ویژگی‌ها (Feature storytelling) ─────────
export type FeatureVisual = 'bracket' | 'escrow' | 'chat' | 'report' | 'leaderboard' | 'platform';
export interface FeatureDef {
  key: string;
  title: string;
  desc: string;
  visual: FeatureVisual;
}
export const FEATURES: FeatureDef[] = [
  { key: 'create', title: 'ساخت تورنومنت در چند دقیقه', desc: 'ویزاردِ گام‌به‌گام: بازی، فرمت، زمان‌بندی، ظرفیت و جوایز — بدونِ دردسر.', visual: 'platform' },
  { key: 'bracket', title: 'براکتِ خودکار و فرمت‌های حرفه‌ای', desc: 'تک‌حذفی، دوحذفی، لیگ، سوئیسی، بتل‌رویال و گروهی + پلی‌آف؛ همه خودکار.', visual: 'bracket' },
  { key: 'live', title: 'چت، اعلان و استریمِ زنده', desc: 'هماهنگیِ لحظه‌ایِ بازیکن‌ها، اعلان‌های پایدار و پخشِ زنده، همه یک‌جا.', visual: 'chat' },
  { key: 'fairplay', title: 'داوری، گزارشِ تخلف و ضدتقلب', desc: 'گیتِ تأییدِ داور، رسیدگی به اعتراض و کنترلِ no-show برای رقابتِ منصفانه.', visual: 'report' },
  { key: 'payment', title: 'پرداختِ امن، escrow و جایزه', desc: 'هزینه‌ی ورودی در escrow مسدود و جایزه پس از نتیجه به‌صورتِ امن آزاد می‌شود.', visual: 'escrow' },
  { key: 'ranking', title: 'رتبه‌بندی، ELO و پروفایلِ بازیکن', desc: 'نردبانِ رده‌بندی، سابقه و آمارِ شفاف برای هر بازیکن و تیم.', visual: 'leaderboard' },
];

// ───────── چطور کار می‌کند ─────────
export interface HowStep {
  n: number;
  title: string;
  desc: string;
}
export const HOW_STEPS: HowStep[] = [
  { n: 1, title: 'تورنومنت را بساز', desc: 'بازی، فرمت و جوایز را در ویزارد انتخاب کن و لینکِ عمومی بگیر.' },
  { n: 2, title: 'بازیکن‌ها ثبت‌نام می‌کنند', desc: 'تیمی یا انفرادی ثبت‌نام می‌کنند؛ ظرفیت و لیستِ انتظار خودکار مدیریت می‌شود.' },
  { n: 3, title: 'نتیجه ثبت و جایزه آزاد می‌شود', desc: 'نتایج با داوری تأیید می‌شوند و جایزه از escrow به برندگان پرداخت می‌شود.' },
];

// ───────── پیل‌های ارزش (qualitative؛ بدونِ عدد) ─────────
export interface StatPill {
  label: string;
  icon: string;
}
export const STAT_PILLS: StatPill[] = [
  { label: '۶ فرمتِ مسابقه', icon: 'bracket' },
  { label: 'براکتِ خودکار', icon: 'flow' },
  { label: 'داوریِ ضدتقلب', icon: 'shield' },
  { label: 'کیف‌پول و escrow', icon: 'wallet' },
  { label: 'چت و استریمِ زنده', icon: 'stream' },
  { label: 'مناسبِ PC، کنسول و موبایل', icon: 'devices' },
];

// ───────── بخش‌های برگزارکننده / بازیکن ─────────
export interface BulletPoint {
  title: string;
  desc: string;
}
export const ORGANIZER_POINTS: BulletPoint[] = [
  { title: 'مدیریتِ ثبت‌نام و ظرفیت', desc: 'تأیید، حذف، لیستِ انتظار و promote خودکار.' },
  { title: 'قوانین و فرمتِ مسابقه', desc: 'امتیازدهیِ سفارشی، check-in و تأییدِ نتیجه.' },
  { title: 'داوری و گزارش‌ها', desc: 'حلِ اختلاف، no-show و کنترلِ تخلف.' },
  { title: 'کیف‌پول و تسویه', desc: 'escrowِ ورودی و توزیعِ خودکارِ جایزه.' },
  { title: 'پنلِ مدیریتِ مسابقه', desc: 'داشبوردِ زنده با همه‌ی ابزارها.' },
  { title: 'لینکِ عمومیِ تورنومنت', desc: 'صفحه‌ی اشتراک‌گذاریِ حرفه‌ای برای جذبِ بازیکن.' },
];
export const PLAYER_POINTS: BulletPoint[] = [
  { title: 'پیدا کردن بر اساسِ بازی', desc: 'مرورِ تورنومنت‌ها بر اساسِ دیسیپلین و پلتفرم.' },
  { title: 'ثبت‌نامِ تیمی یا انفرادی', desc: 'در چند ثانیه به رقابت بپیوند.' },
  { title: 'مشاهده‌ی براکت', desc: 'جایگاهِ خودت و مسیرِ قهرمانی را ببین.' },
  { title: 'چت و هماهنگی', desc: 'با حریف و تیم هماهنگ شو.' },
  { title: 'دریافتِ جایزه', desc: 'جایزه‌ی امن از escrow به کیف‌پولت.' },
  { title: 'سابقه و رتبه', desc: 'پروفایل، ELO و آمارِ شفاف.' },
];
