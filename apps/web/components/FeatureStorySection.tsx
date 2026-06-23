import { ORGANIZER_FEATURES, PLAYER_FEATURES, type FeatureDef } from '@/lib/landing';
import { Reveal } from '@/components/Reveal';
import { FeatureCard } from './FeatureCard';

function Group({ label, sub, items }: { label: string; sub: string; items: FeatureDef[] }) {
  return (
    <div>
      <Reveal>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-display text-lg font-bold">{label}</h3>
          <span className="text-xs text-faint">{sub}</span>
        </div>
      </Reveal>
      <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((f, i) => (
          <Reveal key={f.key} delay={i * 60} className="h-full">
            <FeatureCard f={f} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/** روایتِ ویژگی‌ها — دو دسته: بازیکن‌ها و SHELTER/برگزارکننده‌های تأییدشده. */
export function FeatureStorySection() {
  return (
    <section className="space-y-12">
      <Reveal>
        <h2 className="font-display text-[clamp(22px,3vw,34px)] font-bold leading-tight">همه‌چیز برای یک مسابقه‌ی بی‌نقص</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
          یک سیستمِ کاملِ رقابت — برای بازیکن‌ها ساده، برای SHELTER و برگزارکننده‌های تأییدشده قدرتمند.
        </p>
      </Reveal>

      <Group label="برای بازیکن‌ها" sub="پیدا کن، ثبت‌نام کن، رقابت کن" items={PLAYER_FEATURES} />
      <Group label="برای SHELTER و برگزارکننده‌های تأییدشده" sub="مدیریتِ کاملِ مسابقه" items={ORGANIZER_FEATURES} />
    </section>
  );
}
