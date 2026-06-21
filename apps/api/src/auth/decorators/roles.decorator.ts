import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** نقش‌های مجاز برای یک هندلر/کنترلر. مثال: @Roles('ADMIN'). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
