import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User, UserRole } from 'src/users/entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{user: User}>();
    const user = request.user;

    if (!user) throw new NotFoundException('User not found');

    if (user.role !== UserRole.ADMIN)
      throw new ForbiddenException('Admin access only');

    return true;
  }
}
