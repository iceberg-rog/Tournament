// مدلِ نقش‌ها و ناوبریِ نقش‌محور.

// نقش‌های خامِ API → گروه‌بندیِ محصول.
export type RoleGroup = 'player' | 'organizer' | 'admin';

const STAFF = ['ADMIN', 'MAIN_ADMIN', 'REFEREE', 'SUPPORT', 'GAME_ADMIN'];

export function roleGroup(apiRole?: string): RoleGroup {
  if (apiRole && STAFF.includes(apiRole)) return 'admin';
  if (apiRole === 'ORGANIZER') return 'organizer';
  return 'player';
}

export const ROLE_FA: Record<string, string> = {
  ADMIN: 'مدیر سیستم',
  MAIN_ADMIN: 'مدیر کل',
  REFEREE: 'داور',
  SUPPORT: 'پشتیبان',
  GAME_ADMIN: 'ادمین بازی',
  ORGANIZER: 'برگزارکننده',
  USER: 'بازیکن',
};

export function dashboardLabel(group: RoleGroup): string {
  if (group === 'admin') return 'داشبوردِ مدیریت';
  if (group === 'organizer') return 'داشبوردِ برگزارکننده';
  return 'داشبوردِ بازیکن';
}

/** آیا این نقش اجازه‌ی ساختِ مستقیمِ تورنومنت دارد؟ (بازیکن ندارد) */
export function canCreateTournament(group: RoleGroup): boolean {
  return group === 'admin' || group === 'organizer';
}

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  soon?: boolean; // هنوز کامل پیاده نشده (نشانِ «به‌زودی»)
}
export interface NavGroup {
  label: string;
  items: NavItem[];
}

const PLAYER_NAV: NavGroup[] = [
  {
    label: 'اصلی',
    items: [
      { href: '/dashboard', label: 'داشبورد', icon: 'grid' },
      { href: '/tournaments', label: 'تورنومنت‌ها', icon: 'trophy' },
      { href: '/games', label: 'دیسیپلین‌ها', icon: 'pad' },
    ],
  },
  {
    label: 'رقابت',
    items: [
      { href: '/ladders', label: 'نردبانِ رتبه‌بندی', icon: 'bars' },
      { href: '/seasons', label: 'فصل‌ها', icon: 'calendar' },
    ],
  },
  {
    label: 'حساب',
    items: [
      { href: '/wallet', label: 'کیفِ پول', icon: 'wallet' },
      { href: '/support', label: 'تیکت‌ها', icon: 'ticket' },
      { href: '/security', label: 'امنیت', icon: 'shield' },
      { href: '/report', label: 'گزارشِ تخلف', icon: 'flag' },
    ],
  },
];

const ORGANIZER_NAV: NavGroup[] = [
  {
    label: 'برگزاری',
    items: [
      { href: '/dashboard', label: 'داشبوردِ برگزارکننده', icon: 'grid' },
      { href: '/admin/tournaments', label: 'تورنومنت‌های من', icon: 'trophy' },
      { href: '/tournaments/new', label: 'پیش‌نویسِ تورنومنت', icon: 'plus' },
      { href: '/admin/organizer-requests', label: 'وضعیتِ تأیید', icon: 'inbox' },
    ],
  },
  {
    label: 'حساب',
    items: [
      { href: '/wallet', label: 'کیفِ پول', icon: 'wallet' },
      { href: '/support', label: 'تیکت‌ها', icon: 'ticket' },
      { href: '/security', label: 'امنیت', icon: 'shield' },
    ],
  },
];

const ADMIN_NAV: NavGroup[] = [
  {
    label: 'عملیات',
    items: [
      { href: '/admin', label: 'داشبوردِ مدیریت', icon: 'grid' },
      { href: '/admin/queue', label: 'صفِ اقدامات', icon: 'queue' },
    ],
  },
  {
    label: 'تورنومنت',
    items: [
      { href: '/admin/tournaments', label: 'مدیریتِ تورنومنت‌ها', icon: 'trophy' },
      { href: '/tournaments/new', label: 'ساختِ تورنومنت', icon: 'plus' },
      { href: '/admin/organizer-requests', label: 'درخواست‌های برگزارکننده', icon: 'inbox' },
      { href: '/games', label: 'دیسیپلین‌ها', icon: 'pad' },
      { href: '/ladders', label: 'نردبان', icon: 'bars' },
      { href: '/seasons', label: 'فصل‌ها', icon: 'calendar' },
    ],
  },
  {
    label: 'کاربران',
    items: [
      { href: '/admin/users', label: 'کاربران', icon: 'users' },
      { href: '/admin/kyc', label: 'احرازِ هویت', icon: 'idcard' },
    ],
  },
  {
    label: 'مالی',
    items: [{ href: '/admin/finance', label: 'مالی و escrow', icon: 'wallet' }],
  },
  {
    label: 'نظارت',
    items: [
      { href: '/admin/reports', label: 'گزارش‌های تخلف', icon: 'flag' },
      { href: '/support', label: 'تیکت‌ها', icon: 'ticket' },
      { href: '/admin/audit-log', label: 'گزارشِ ممیزی', icon: 'log' },
    ],
  },
  {
    label: 'سیستم',
    items: [
      { href: '/admin/settings/integrations', label: 'اتصال‌ها و APIها', icon: 'plug' },
      { href: '/settings', label: 'تنظیمات', icon: 'gear' },
    ],
  },
];

export function navForGroup(group: RoleGroup): NavGroup[] {
  if (group === 'admin') return ADMIN_NAV;
  if (group === 'organizer') return ORGANIZER_NAV;
  return PLAYER_NAV;
}
