import type { UserRole } from '../types';

export const USER_ROLES: UserRole[] = ['ADMIN', 'CONSULTANT', 'USER'];

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Yönetici',
  CONSULTANT: 'Danışman',
  USER: 'Kullanıcı',
};
