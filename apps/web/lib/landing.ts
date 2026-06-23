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
// ویژگی‌ها برای بازیکن‌ها (شرکت در رقابت).
export const PLAYER_FEATURES: FeatureDef[] = [
  { key: 'find', title: 'پیدا کردنِ تورنومنت‌های معتبر', desc: 'رقابت‌های رسمیِ SHELTER را بر اساسِ بازی، پلتفرم و جایزه پیدا کن.', visual: 'platform' },
  { key: 'register', title: 'ثبت‌نامِ تیمی یا انفرادی', desc: 'در چند ثانیه به تورنومنت بپیوند؛ ظرفیت و لیستِ انتظار خودکار.', visual: 'chat' },
  { key: 'bracket', title: 'مشاهده‌ی براکت و برنامه‌ی بازی‌ها', desc: 'جایگاهت و مسیرِ قهرمانی را زنده دنبال کن.', visual: 'bracket' },
  { key: 'result', title: 'ثبتِ نتیجه و پیگیریِ داوری', desc: 'نتایج با تأییدِ داور نهایی می‌شوند؛ شفاف و قابلِ پیگیری.', visual: 'report' },
  { key: 'prize', title: 'دریافتِ جایزه‌ی امن', desc: 'جایزه از escrow مستقیم به کیف‌پولت آزاد می‌شود.', visual: 'escrow' },
  { key: 'profile', title: 'سابقه، رتبه و پروفایل', desc: 'ELO، نتایجِ گذشته و آمارِ شفافِ تو و تیمت.', visual: 'leaderboard' },
];

// ویژگی‌ها برای SHELTER و برگزارکننده‌های تأییدشده (مدیریتِ مسابقه).
export const ORGANIZER_FEATURES: FeatureDef[] = [
  { key: 'reg', title: 'مدیریتِ ثبت‌نام و ظرفیت', desc: 'تأیید، حذف و لیستِ انتظار برای هر تورنومنت.', visual: 'platform' },
  { key: 'fmt', title: 'براکت و فرمتِ رسمیِ مسابقه', desc: 'تک‌حذفی تا گروهی + پلی‌آف؛ خودکار و استاندارد.', visual: 'bracket' },
  { key: 'judge', title: 'داوری و گزارشِ تخلف', desc: 'گیتِ تأییدِ نتیجه، no-show و کنترلِ ضدتقلب.', visual: 'report' },
  { key: 'pay', title: 'پرداختِ امن و escrow', desc: 'ورودی و جایزه با نظارتِ SHELTER تسویه می‌شود.', visual: 'escrow' },
  { key: 'live', title: 'چت، اعلان و کنترلِ زنده', desc: 'هماهنگی و مدیریتِ لحظه‌ایِ مسابقه.', visual: 'chat' },
  { key: 'rank', title: 'رتبه‌بندی و آمار', desc: 'نردبان و آمارِ شفافِ رقابت‌ها.', visual: 'leaderboard' },
];

// ───────── چطور کار می‌کند ─────────
export interface HowStep {
  n: number;
  title: string;
  desc: string;
}
// مسیرِ بازیکن.
export const HOW_STEPS: HowStep[] = [
  { n: 1, title: 'تورنومنت را انتخاب کن', desc: 'تورنومنت‌های فعال را بر اساسِ بازی، پلتفرم و جایزه پیدا کن.' },
  { n: 2, title: 'ثبت‌نام کن و رقابت را دنبال کن', desc: 'تیمی یا انفرادی وارد شو، براکت و زمانِ بازی‌ها را ببین.' },
  { n: 3, title: 'نتیجه ثبت و جایزه پرداخت می‌شود', desc: 'نتایج با داوری تأیید و جایزه به‌صورتِ امن آزاد می‌شود.' },
];

// مسیرِ برگزارکننده (همکاریِ تأییدشده).
export const ORGANIZER_STEPS: HowStep[] = [
  { n: 1, title: 'درخواستِ همکاری ارسال کن', desc: 'به‌عنوانِ تیم، کلن یا برندِ گیمینگ درخواست بده.' },
  { n: 2, title: 'پنلِ محدودِ برگزارکننده دریافت کن', desc: 'پس از بررسی، دسترسیِ ساختِ پیش‌نویس فعال می‌شود.' },
  { n: 3, title: 'انتشار پس از تأییدِ SHELTER', desc: 'تورنومنت پس از بررسی و تأیید منتشر می‌شود.' },
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
// امکاناتِ پنلِ برگزارکننده — فقط برای همکارانِ تأییدشده‌ی SHELTER.
export const ORGANIZER_POINTS: BulletPoint[] = [
  { title: 'پنلِ ارسالِ درخواستِ تورنومنت', desc: 'پیش‌نویسِ تورنومنت را برای بررسی بفرست.' },
  { title: 'تعریفِ بازی، فرمت، قوانین و ظرفیت', desc: 'همه‌چیز استاندارد و حرفه‌ای.' },
  { title: 'مدیریتِ ثبت‌نام', desc: 'تأیید، ظرفیت و لیستِ انتظار.' },
  { title: 'صفِ بررسی و تأییدِ SHELTER', desc: 'انتشار فقط پس از approval.' },
  { title: 'گزارش‌دهی و داوری', desc: 'حلِ اختلاف و کنترلِ تخلف.' },
  { title: 'تسویه و جایزه با نظارتِ SHELTER', desc: 'پرداختِ امن و شفاف.' },
];
export const PLAYER_POINTS: BulletPoint[] = [
  { title: 'پیدا کردن بر اساسِ بازی', desc: 'مرورِ تورنومنت‌ها بر اساسِ دیسیپلین و پلتفرم.' },
  { title: 'ثبت‌نامِ تیمی یا انفرادی', desc: 'در چند ثانیه به رقابت بپیوند.' },
  { title: 'مشاهده‌ی براکت', desc: 'جایگاهِ خودت و مسیرِ قهرمانی را ببین.' },
  { title: 'چت و هماهنگی', desc: 'با حریف و تیم هماهنگ شو.' },
  { title: 'دریافتِ جایزه', desc: 'جایزه‌ی امن از escrow به کیف‌پولت.' },
  { title: 'سابقه و رتبه', desc: 'پروفایل، ELO و آمارِ شفاف.' },
];
