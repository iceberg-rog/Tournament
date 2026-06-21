# @tournament/engine — موتور تورنومنت

موتور خالص (بدون دیتابیس) برای تولید و اجرای براکت/ساختار همه‌ی فرمت‌های مسابقه. منطق مرکزی و سخت‌ترین بخش پلتفرم؛ به‌صورت TypeScript قابل‌تست و مستقل.

## فرمت‌های پشتیبانی‌شده

| فرمت | شرح | امتیازدهی |
|------|------|-----------|
| `SINGLE_ELIM` | حذفی تک، با seeding استاندارد و BYE برای تعداد فرد | برنده تک‌مسیر |
| `DOUBLE_ELIM` | حذفی دوگانه: براکت برنده‌ها + بازنده‌ها + Grand Final با bracket reset | حذف با دو باخت |
| `ROUND_ROBIN` | همه با همه یک‌بار (لیگ/گروهی) | برد×۳، tiebreak رو‌در‌رو |
| `SWISS` | جفت‌گیری هم‌امتیاز، بدون تکرار، راندِ ثابت | برد، tiebreak seed |
| `FFA` | لابی چندنفره چندراندی (Battle Royale: PUBG/Warzone) | placement-محور تجمعی |

## استفاده

```ts
import { createTournament, Participant } from '@tournament/engine';

const players: Participant[] = [
  { id: 'u1', name: 'Ali',  seed: 1, skill: 0.9 },
  { id: 'u2', name: 'Sara', seed: 2, skill: 0.7 },
  // ...
];

const t = createTournament('SINGLE_ELIM', players);

while (!t.isComplete()) {
  for (const m of t.ready()) {
    if (m.kind === 'DUEL') {
      // [a, b] = m.participantIds  → نتیجه را تعیین کن
      t.reportDuel(m.id, winnerId);
    } else {
      // LOBBY (FFA): رتبه‌بندی کامل شرکت‌کنندگان
      t.reportLobby(m.id, rankedIds);
    }
  }
}

t.champion();   // قهرمان
t.standings();  // رده‌بندی کامل (rank 1..N)
```

رابط مشترک `Engine`: `ready()`, `reportDuel()`, `reportLobby()`, `isComplete()`, `standings()`, `champion()`.

## شبیه‌ساز / تست

```bash
npm run sim -w @tournament/engine
```
شبیه‌ساز **۳۶ سناریو** را اجرا می‌کند: همه‌ی فرمت‌ها × تعداد شرکت‌کننده‌های مختلف (شامل فردِ نیازمند BYE: ۳،۵،۷،۶،۱۲،۱۵،…) × انواع بازی (DUEL/TEAM/FFA) و کاربران مختلف. برای هر سناریو تأیید می‌کند:
- تورنومنت کامل می‌شود (بدون گیر/حلقه‌ی بی‌نهایت)
- دقیقاً یک قهرمان دارد
- رده‌بندی کامل و یکتا (rank = 1..N، بدون تکرار)
- تعداد مسابقات منطبق با فرمول (مثلاً حذفی = N−۱، round-robin = C(N,2))
- در double-elim: قهرمان حداکثر یک باخت دارد

## ساختار

```
src/
  types.ts        رابط Engine و انواع مشترک
  util.ts         nextPow2, seedOrder, propagate
  rng.ts          RNG قابل‌تکرار (شبیه‌سازی قطعی)
  singleElim.ts   حذفی تک
  doubleElim.ts   حذفی دوگانه (با سنتینل DEAD برای BYE)
  roundRobin.ts   لیگ کامل
  swiss.ts        سوئیسی
  ffa.ts          FFA / Battle Royale
  engine.ts       factory مرکزی createTournament()
  sim.ts          شبیه‌ساز/تست
```

## افزودن فرمت جدید (برای توسعه‌ی آینده)

۱. یک کلاس که `Engine` را پیاده می‌کند بساز (الگو: `roundRobin.ts`).
۲. در `engine.ts` به `switch` factory اضافه کن.
۳. در `sim.ts` چند سناریو + `expectedMatches` برایش بنویس و `npm run sim` را سبز نگه‌دار.

## نقشه‌ی توسعه

- اتصال موتور به persistence (Prisma) و ماشین حالت `Match`/`Lobby` سند طراحی.
- tiebreakهای پیشرفته (Buchholz در Swiss، رو‌در‌رو چندطرفه).
- بهینه‌سازی جفت‌گیری Swiss (جلوگیری از rematch با backtracking).
- تقسیم FFA به چند لابی برای تعداد خیلی زیاد.
