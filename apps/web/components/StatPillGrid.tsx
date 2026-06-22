import { Reveal } from '@/components/Reveal';
import { STAT_PILLS } from '@/lib/landing';

/** آیکونِ خطیِ teal برای هر کلیدِ پیل. */
function PillIcon({ name }: { name: string }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'bracket': // فرمت‌های مسابقه — درختِ براکت
      return (
        <svg {...common}>
          <path d="M4 5h5v6h6V5" />
          <path d="M15 11h5" />
          <path d="M4 19h5v-6" />
        </svg>
      );
    case 'flow': // براکتِ خودکار — جریانِ گره‌ها
      return (
        <svg {...common}>
          <rect x="3" y="9" width="6" height="6" rx="1.5" />
          <rect x="15" y="3" width="6" height="6" rx="1.5" />
          <rect x="15" y="15" width="6" height="6" rx="1.5" />
          <path d="M9 12h3M12 6v12M12 6h3M12 18h3" />
        </svg>
      );
    case 'shield': // داوریِ ضدتقلب — سپر با تیک
      return (
        <svg {...common}>
          <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case 'wallet': // کیف‌پول و escrow
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="13" rx="3" />
          <path d="M3 10h18" />
          <circle cx="16.5" cy="14.5" r="1.2" />
        </svg>
      );
    case 'stream': // چت و استریمِ زنده — پخش
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2.5" />
          <path d="M6.5 6.5a8 8 0 0 0 0 11M17.5 6.5a8 8 0 0 1 0 11" />
          <path d="M9.5 9.5a4 4 0 0 0 0 5M14.5 9.5a4 4 0 0 1 0 5" />
        </svg>
      );
    case 'devices': // PC، کنسول و موبایل
      return (
        <svg {...common}>
          <rect x="2" y="4" width="14" height="10" rx="2" />
          <path d="M2 17h14" />
          <rect x="16.5" y="9" width="5.5" height="11" rx="1.5" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

/** ردیفِ پیل‌های اعتماد زیرِ هیرو — کیفی، data-driven از STAT_PILLS. */
export function StatPillGrid() {
  return (
    <Reveal as="section" className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap md:grid md:grid-cols-3 lg:grid-cols-6">
      {STAT_PILLS.map((pill) => (
        <div
          key={pill.icon}
          className="group flex items-center gap-2.5 rounded-xl border border-line bg-tile px-4 py-2.5 shadow-[0_18px_40px_-30px_rgba(0,0,0,.8)] transition duration-200 hover:-translate-y-0.5 hover:border-accent/40"
        >
          <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-accent/10 text-accent transition-colors duration-200 group-hover:bg-accent/15">
            <PillIcon name={pill.icon} />
          </span>
          <span className="text-sm font-medium leading-6 text-muted transition-colors duration-200 group-hover:text-slate-200">
            {pill.label}
          </span>
        </div>
      ))}
    </Reveal>
  );
}
