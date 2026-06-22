// فیدِ فعالیتِ زنده‌ی Hero (typed؛ data-driven).
export type ActivityKind = 'result' | 'advance' | 'referee' | 'join' | 'prize';

export interface ActivityItem {
  id: string;
  text: string;
  kind: ActivityKind;
}

export const ACTIVITY_FEED: ActivityItem[] = [
  { id: 'a1', text: 'Phantom X نتیجه را ثبت کرد', kind: 'result' },
  { id: 'a2', text: 'Valor GG وارد نیمه‌نهایی شد', kind: 'advance' },
  { id: 'a3', text: 'داور نتیجه‌ی Map 2 را تأیید کرد', kind: 'referee' },
  { id: 'a4', text: 'تیمِ Nebula ثبت‌نام کرد', kind: 'join' },
  { id: 'a5', text: 'جایزه‌ی رتبه‌ی ۱ از escrow آزاد شد', kind: 'prize' },
  { id: 'a6', text: 'Apex Titans به فینال صعود کرد', kind: 'advance' },
  { id: 'a7', text: 'Stormkings چک‌این کرد', kind: 'join' },
];

export const ACTIVITY_DOT: Record<ActivityKind, string> = {
  result: 'bg-accent',
  advance: 'bg-accent',
  referee: 'bg-gold',
  join: 'bg-slate-400',
  prize: 'bg-gold',
};
