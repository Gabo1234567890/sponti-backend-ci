import { AdminGuard } from './admin.guard';
import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from 'src/users/entities/user.entity';

describe('AdminGuard', () => {
  let guard: AdminGuard;

  const mockExecutionContext = (user: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    guard = new AdminGuard();
  });

  it('should throw NotFoundException if user is missing', () => {
    const context = mockExecutionContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if user is not admin', () => {
    const context = mockExecutionContext({
      role: UserRole.USER,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access if user is admin', () => {
    const context = mockExecutionContext({
      role: UserRole.ADMIN,
    });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });
});