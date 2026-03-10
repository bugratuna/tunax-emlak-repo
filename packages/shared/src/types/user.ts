export type UserRole = 'ADMIN' | 'CONSULTANT' | 'USER';

export type UserStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED';

export interface User {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  bio?: string;
  profilePhotoUrl?: string;
  status?: UserStatus;
}
