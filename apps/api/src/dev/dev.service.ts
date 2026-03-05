import { Injectable } from '@nestjs/common';
import { UsersService, SafeUser } from '../users/users.service';
import { CreateDevUserDto } from './dto/create-dev-user.dto';

@Injectable()
export class DevService {
  constructor(private readonly usersService: UsersService) {}

  async createUser(dto: CreateDevUserDto): Promise<SafeUser> {
    return this.usersService.createUser({
      email: dto.email,
      password: dto.password,
      role: dto.role,
      name: dto.name,
    });
  }

  async listUsers(): Promise<SafeUser[]> {
    return this.usersService.listAll();
  }

  async reset(): Promise<SafeUser[]> {
    return this.usersService.reset();
  }
}
