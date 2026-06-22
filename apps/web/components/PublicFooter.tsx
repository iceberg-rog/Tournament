import Link from 'next/link';
import { Reveal } from '@/components/Reveal';

interface FooterLink {
  href: string;
  label: string;
}
interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const COLUMNS: FooterColumn[] = [
  {
    title: 'محصول',
    links: [
      { href: '/tournaments', label: 'تورنومنت‌ها' },
      { href: '/games', label: 'دیسیپلین‌ها' },
      { href: '/login', label: 'ساخت تورنومنت' },
    ],
  },
  {
    title: 'شرکت',
    links: [
      { href: '#', label: 'درباره‌ی ما' },
      { href: '#', label: 'تماس' },
      { href: '/register', label: 'برگزارکنندگان' },
    ],
  },
  {
    title: 'قانونی',
    links: [
      { href: '#', label: 'قوانین' },
      { href: '#', label: 'حریمِ خصوصی' },
    ],
  },
];

interface SocialDef {
  label: string;
  href: string;
  path: React.ReactNode;
}

const SOCIALS: SocialDef[] = [
  {
    label: 'X',
    href: '#',
    path: <path d="M4 4l16 16M20 4L4 20" />,
  },
  {
    label: 'Discord',
    href: '#',
    path: (
      <>
        <path d="M8.5 4.5c-2 .4-3.7 1.1-5 2.1C1.8 9.4 1.2 12.4 1.5 15.6c1.4 1 2.9 1.7 4.4 2.1l.9-1.5" />
        <path d="M15.5 4.5c2 .4 3.7 1.1 5 2.1 1.7 2.8 2.3 5.8 2 9-1.4 1-2.9 1.7-4.4 2.1l-.9-1.5" />
        <path d="M7 13.5c1.6.9 3.3 1.3 5 1.3s3.4-.4 5-1.3" />
        <circle cx="9" cy="11" r=".6" />
        <circle cx="15" cy="11" r=".6" />
      </>
    ),
  },
  {
    label: 'Instagram',
    href: '#',
    path: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r=".6" />
      </>
    ),
  },
];

/** فوترِ عمومیِ سایت: برند، ستون‌های لینک، شبکه‌های اجتماعی و نوارِ پایین. */
export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-ink/40">
      <Reveal className="mx-auto max-w-[1280px] px-4 py-14 md:px-6 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-8">
          {/* بلوکِ برند */}
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-gradient-to-br from-accent to-accent-dim text-[#06231f] shadow-[0_6px_18px_-8px_rgba(45,212,191,.6)]">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" />
                </svg>
              </span>
              <span className="font-display text-[19px] font-bold tracking-[.14em]">SHELTER</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-muted">
              پلتفرمِ برگزاری و مدیریتِ تورنومنت‌های ای‌اسپورت — از براکتِ خودکار تا داوری و پرداختِ امن، همه یک‌جا.
            </p>

            {/* شبکه‌های اجتماعی */}
            <div className="mt-6 flex items-center gap-2.5">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-tile text-muted transition duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {s.path}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* ستون‌های لینک */}
          {COLUMNS.map((col) => (
            <nav key={col.title} className="min-w-0">
              <h3 className="text-xs font-semibold uppercase tracking-[.12em] text-faint">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="inline-flex items-center text-sm leading-7 text-muted transition-colors hover:text-text"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* نوارِ پایین */}
        <div className="mt-12 flex flex-col items-start gap-3 border-t border-line pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p className="leading-6">© ۲۰۲۶ SHELTER — همه‌ی حقوق محفوظ است.</p>
          <p className="flex items-center gap-2 leading-6">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            ساخته‌شده برای رقابتِ منصفانه
          </p>
        </div>
      </Reveal>
    </footer>
  );
}
