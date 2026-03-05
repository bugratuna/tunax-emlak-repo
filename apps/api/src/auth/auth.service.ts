import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { User } from '../store/store';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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

  async login(user: User): Promise<{ accessToken: string }> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return { accessToken: this.jwtService.sign(payload) };
  }
}
