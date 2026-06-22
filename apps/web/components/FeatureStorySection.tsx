import { FEATURES } from '@/lib/landing';
import { Reveal } from '@/components/Reveal';
import { FeatureCard } from './FeatureCard';

/** بخشِ روایتِ ویژگی‌ها: شبکه‌ی کارت‌های ویژگی با ویژوالِ میکروِ اختصاصی. */
export function FeatureStorySection() {
  return (
    <section>
      <Reveal>
        <h2 className="font-display text-[clamp(22px,3vw,34px)] font-bold leading-tight text-white">
          همه‌چیز برای یک مسابقه‌ی بی‌نقص
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
          از ساختِ تورنومنت تا توزیعِ جایزه — ابزارهای حرفه‌ای برای برگزارکننده‌ها و بازیکن‌ها، یک‌جا و یکپارچه.
        </p>
      </Reveal>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.key} delay={i * 60} className="h-full">
            <FeatureCard f={f} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
