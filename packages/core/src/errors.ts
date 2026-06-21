/**
 * خطای دامنه (اعتبارسنجی/قاعده‌ی کسب‌وکار) — قابل‌نگاشت به HTTP 400.
 * متمایز از خطاهای داخلی (که به ۵۰۰ نگاشت می‌شوند).
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}
