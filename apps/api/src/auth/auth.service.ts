import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { S3Service } from '../media/s3.service';
import { Role } from '../common/enums/role.enum';
import { User } from '../store/store';

// Multer file shape (avoids @types/multer peer dep)
interface MulterFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly s3Service: S3Service,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    if (user.status === 'PENDING_APPROVAL') {
      throw new ForbiddenException(
        'Hesabınız henüz onaylanmamış. Lütfen yönetici onayını bekleyin.',
      );
    }
    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException(
        'Hesabınız askıya alınmış. Lütfen yönetici ile iletişime geçin.',
      );
    }

    return user;
  }

  login(user: User): { accessToken: string } {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return { accessToken: this.jwtService.sign(payload) };
  }

  async register(input: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    profilePhoto?: MulterFile;
  }) {
    const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

    let profilePhotoUrl: string | undefined;

    if (input.profilePhoto) {
      if (!ALLOWED_MIME.includes(input.profilePhoto.mimetype)) {
        throw new BadRequestException(
          'Profil fotoğrafı yalnızca jpg, png veya webp formatında olabilir.',
        );
      }
      if (input.profilePhoto.size > MAX_SIZE) {
        throw new BadRequestException(
          'Profil fotoğrafı en fazla 5 MB olabilir.',
        );
      }
      const ext =
        input.profilePhoto.originalname
          .split('.')
          .pop()
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, '') ?? 'jpg';
      const key = `profiles/${randomUUID()}.${ext}`;
      try {
        profilePhotoUrl = await this.s3Service.putObject(
          key,
          input.profilePhoto.buffer,
          input.profilePhoto.mimetype,
        );
      } catch (err) {
        this.logger.error(
          `[register] S3 upload failed for key=${key}: ${(err as Error).message}`,
          (err as Error).stack,
        );
        throw new InternalServerErrorException(
          'Profil fotoğrafı yüklenemedi. Lütfen daha sonra tekrar deneyin.',
        );
      }
    }

    return this.usersService.createUser({
      email: input.email,
      password: input.password,
      role: Role.CONSULTANT,
      firstName: input.firstName,
      lastName: input.lastName,
      name: `${input.firstName} ${input.lastName}`,
      phoneNumber: input.phoneNumber,
      profilePhotoUrl,
      status: 'PENDING_APPROVAL',
    });
  }
}
