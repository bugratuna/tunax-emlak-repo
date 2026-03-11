import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserEntity, UserStatus } from '../database/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import type { User } from '../store/store';

// ── SafeUser — User without passwordHash, for API responses ───────────────────
export type SafeUser = Omit<User, 'passwordHash'>;

// ── PublicConsultant — public-facing profile for /team endpoint ───────────────
export interface PublicConsultant {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  email: string;
  role: string;
  phoneNumber: string | null;
  bio: string | null;
  title: string | null;
  profilePhotoUrl: string | null;
  createdAt: string;
}

function toPublicConsultant(e: UserEntity): PublicConsultant {
  return {
    id: e.id,
    firstName: e.firstName ?? null,
    lastName: e.lastName ?? null,
    name: e.name ?? e.email,
    email: e.email,
    role: e.role,
    phoneNumber: e.phoneNumber ?? null,
    bio: e.bio ?? null,
    profilePhotoUrl: e.profilePhotoUrl ?? null,
    title: e.title ?? null,
    createdAt: e.createdAt.toISOString(),
  };
}

// ── Entity → User mapper (preserves the User interface used by AuthService) ───
function toUser(e: UserEntity): User {
  return {
    id: e.id,
    email: e.email,
    passwordHash: e.passwordHash,
    role: e.role,
    name: e.name ?? e.email,
    status: e.status,
    isActive: e.status === 'ACTIVE',
    firstName: e.firstName ?? null,
    lastName: e.lastName ?? null,
    phoneNumber: e.phoneNumber ?? null,
    createdAt: e.createdAt.toISOString(),
  };
}

function toSafeUser(e: UserEntity): SafeUser {
  const { passwordHash: _, ...rest } = toUser(e);
  return rest;
}

// ── Seed users (always ACTIVE on bootstrap) ───────────────────────────────────
const SEED_USERS = [
  {
    email: 'admin@arep.local',
    password: 'Admin123!',
    role: Role.ADMIN,
    name: 'Admin',
  },
  {
    email: 'consultant@arep.local',
    password: 'Consultant123!',
    role: Role.CONSULTANT,
    name: 'Consultant',
  },
] as const;

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) { }

  // Seed dev users into PostgreSQL on every boot (upsert — safe to re-run).
  // Only runs when FEATURE_SEED_USERS=true. Must never run in production
  // (enforced by validateEnv() which rejects FEATURE_SEED_USERS=true in production).
  async onModuleInit(): Promise<void> {
    if (process.env.FEATURE_SEED_USERS !== 'true') return;

    console.warn(
      '[Tunax] FEATURE_SEED_USERS=true — seeding dev accounts. This must NOT run in production.',
    );
    for (const s of SEED_USERS) {
      const exists = await this.repo.findOneBy({ email: s.email });
      if (!exists) {
        const passwordHash = await bcrypt.hash(s.password, 10);
        await this.repo.save(
          this.repo.create({
            email: s.email,
            passwordHash,
            role: s.role,
            name: s.name,
            status: 'ACTIVE',
          }),
        );
      }
    }
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<User | undefined> {
    const e = await this.repo.findOneBy({ id });
    return e ? toUser(e) : undefined;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const e = await this.repo
      .createQueryBuilder('u')
      .where('lower(u.email) = lower(:email)', { email })
      .getOne();
    return e ? toUser(e) : undefined;
  }

  async listAll(): Promise<SafeUser[]> {
    const all = await this.repo.find({ order: { createdAt: 'ASC' } });
    return all.map(toSafeUser);
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  /**
   * Creates a new user. Defaults to PENDING_APPROVAL (requires admin approval before login).
   * Seed users are explicitly set to ACTIVE via onModuleInit.
   */
  async createUser(input: {
    email: string;
    password: string;
    role: Role;
    name?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    profilePhotoUrl?: string;
    status?: UserStatus;
  }): Promise<SafeUser> {
    const existing = await this.repo.findOneBy({ email: input.email });
    if (existing)
      throw new ConflictException(`User ${input.email} already exists`);

    const passwordHash = await bcrypt.hash(input.password, 10);
    const saved = await this.repo.save(
      this.repo.create({
        email: input.email,
        passwordHash,
        role: input.role,
        name: input.name ?? input.email,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        phoneNumber: input.phoneNumber ?? null,
        profilePhotoUrl: input.profilePhotoUrl ?? null,
        status: input.status ?? 'PENDING_APPROVAL',
      }),
    );
    return toSafeUser(saved);
  }

  async approveUser(id: string): Promise<SafeUser> {
    const e = await this.repo.findOneBy({ id });
    if (!e) throw new NotFoundException(`User ${id} not found`);
    e.status = 'ACTIVE';
    return toSafeUser(await this.repo.save(e));
  }

  async suspendUser(id: string, requesterId?: string): Promise<SafeUser> {
    if (requesterId && requesterId === id) {
      throw new ForbiddenException('Kendi hesabınızı askıya alamazsınız.');
    }
    const e = await this.repo.findOneBy({ id });
    if (!e) throw new NotFoundException(`User ${id} not found`);
    if (e.role === Role.ADMIN) {
      throw new ForbiddenException('Yönetici hesabı askıya alınamaz.');
    }
    e.status = 'SUSPENDED';
    return toSafeUser(await this.repo.save(e));
  }

  async activateUser(id: string): Promise<SafeUser> {
    const e = await this.repo.findOneBy({ id });
    if (!e) throw new NotFoundException(`User ${id} not found`);
    e.status = 'ACTIVE';
    return toSafeUser(await this.repo.save(e));
  }

  async findPublicConsultants(): Promise<PublicConsultant[]> {
    // Show ACTIVE users of any role — includes both CONSULTANT and ADMIN (for leadership cards)
    const entities = await this.repo.find({
      where: { role: Role.CONSULTANT, status: 'ACTIVE' },
      order: { createdAt: 'ASC' },
    });
    return entities.map(toPublicConsultant);
  }

  async findPublicConsultantById(id: string): Promise<PublicConsultant | null> {
    const e = await this.repo.findOne({
      where: { id, status: 'ACTIVE' },
    });
    return e ? toPublicConsultant(e) : null;
  }

  async updateProfile(
    id: string,
    input: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      name?: string;
      bio?: string;
      profilePhotoUrl?: string;
    },
  ): Promise<SafeUser> {
    const e = await this.repo.findOneBy({ id });
    if (!e) throw new NotFoundException(`User ${id} not found`);
    if (input.name !== undefined) e.name = input.name;
    if (input.firstName !== undefined) e.firstName = input.firstName ?? null;
    if (input.lastName !== undefined) e.lastName = input.lastName ?? null;
    if (input.phoneNumber !== undefined)
      e.phoneNumber = input.phoneNumber ?? null;
    if (input.bio !== undefined) e.bio = input.bio ?? null;
    if (input.profilePhotoUrl !== undefined)
      e.profilePhotoUrl = input.profilePhotoUrl ?? null;
    return toSafeUser(await this.repo.save(e));
  }

  /**
   * Resets users table to seed defaults.
   * DEV-ONLY — deletes all rows then re-seeds.
   */
  async reset(): Promise<SafeUser[]> {
    await this.repo.clear();
    await this.onModuleInit();
    return this.listAll();
  }
}
