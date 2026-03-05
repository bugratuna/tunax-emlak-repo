import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../../common/enums/role.enum';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'role', type: 'varchar', length: 20, default: Role.CONSULTANT })
  role: Role;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
  firstName: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  lastName: string | null;

  @Column({ name: 'phone_number', type: 'varchar', length: 30, nullable: true })
  phoneNumber: string | null;

  @Column({ name: 'bio', type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'profile_photo_url', type: 'varchar', length: 1000, nullable: true })
  profilePhotoUrl: string | null;

  /** Job title — used for team page grouping (e.g. 'Ofis Ortağı', 'Kurucu Ortak'). */
  @Column({ name: 'title', type: 'varchar', length: 200, nullable: true })
  title: string | null;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'ACTIVE' })
  status: UserStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
