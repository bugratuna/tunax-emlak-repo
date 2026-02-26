import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  private readonly validKeys: Set<string>;

  constructor() {
    const raw = process.env.INTERNAL_API_KEYS ?? '';
    this.validKeys = new Set(
      raw
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.headers['x-internal-api-key'] as string | undefined;
    if (!key || !this.validKeys.has(key)) {
      throw new UnauthorizedException('Invalid or missing x-internal-api-key');
    }
    return true;
  }
}
