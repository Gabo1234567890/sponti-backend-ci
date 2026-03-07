import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BadRequestException } from '@nestjs/common';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Partial<AuthService>;

  beforeEach(async () => {
    authService = {
      signup: jest.fn(),
      verifyEmail: jest.fn(),
      validateUser: jest.fn(),
      login: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
      requestPasswordReset: jest.fn(),
      resetPassword: jest.fn(),
    };

    (authService as any).jwtService = { verify: jest.fn() };
    (authService as any).config = { get: jest.fn().mockReturnValue('refresh_secret') };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should call authService.signup and return user id and email', async () => {
      const dto = { username: 'u', email: 'e@test.com', password: 'p' };
      (authService.signup as jest.Mock).mockResolvedValue({ id: '1', email: 'e@test.com' });

      const result = await controller.signup(dto);
      expect(result).toEqual({ id: '1', email: 'e@test.com' });
      expect(authService.signup).toHaveBeenCalledWith('u', 'e@test.com', 'p');
    });
  });

  describe('verifyEmail', () => {
    it('should call authService.verifyEmail', async () => {
      const query = { email: 'e@test.com', token: 'tok' };
      (authService.verifyEmail as jest.Mock).mockResolvedValue('verified');

      const result = await controller.verifyEmail(query);
      expect(result).toBe('verified');
      expect(authService.verifyEmail).toHaveBeenCalledWith('e@test.com', 'tok');
    });
  });

  describe('login', () => {
    it('should throw BadRequestException if user not found', async () => {
      const dto = { email: 'e@test.com', password: 'p' };
      (authService.validateUser as jest.Mock).mockResolvedValue(null);

      await expect(controller.login(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if email not verified', async () => {
      const dto = { email: 'e@test.com', password: 'p' };
      (authService.validateUser as jest.Mock).mockResolvedValue({ emailVerified: false });

      await expect(controller.login(dto)).rejects.toThrow(BadRequestException);
    });

    it('should call authService.login if valid', async () => {
      const dto = { email: 'e@test.com', password: 'p' };
      const user = { emailVerified: true };
      (authService.validateUser as jest.Mock).mockResolvedValue(user);
      (authService.login as jest.Mock).mockReturnValue({ accessToken: 'a', refreshToken: 'r' });

      const result = await controller.login(dto);
      expect(result).toEqual({ accessToken: 'a', refreshToken: 'r' });
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshTokens', async () => {
      const dto = { refreshToken: 'rt' };
      ((authService as any).jwtService.verify).mockReturnValue({ sub: '123' });
      (authService.refreshTokens as jest.Mock).mockReturnValue({ accessToken: 'a', refreshToken: 'r' });

      const result = await controller.refresh(dto);
      expect(result).toEqual({ accessToken: 'a', refreshToken: 'r' });
      expect((authService as any).jwtService.verify).toHaveBeenCalledWith('rt', { secret: 'refresh_secret' });
    });
  });

  describe('logout', () => {
    it('should call authService.logout', async () => {
      const user = { userId: '123' };
      const result = await controller.logout(user as any);
      expect(authService.logout).toHaveBeenCalledWith('123');
      expect(result).toEqual({ message: 'Logged out' });
    });
  });

  describe('requestReset', () => {
    it('should call authService.requestPasswordReset', async () => {
      const dto = { email: 'e@test.com' };
      (authService.requestPasswordReset as jest.Mock).mockResolvedValue('ok');

      const result = await controller.requestReset(dto);
      expect(result).toBe('ok');
      expect(authService.requestPasswordReset).toHaveBeenCalledWith('e@test.com');
    });
  });

  describe('reset', () => {
    it('should call authService.resetPassword', async () => {
      const query = { email: 'e@test.com', token: 'tok' };
      const body = { password: 'new' };
      (authService.resetPassword as jest.Mock).mockResolvedValue('ok');

      const result = await controller.reset(query, body);
      expect(result).toBe('ok');
      expect(authService.resetPassword).toHaveBeenCalledWith('e@test.com', 'tok', 'new');
    });
  });

  describe('redirects', () => {
    it('should redirect reset-password', () => {
      const res = { redirect: jest.fn() } as unknown as Response;
      controller.resetPasswordRedirect('tok', 'e@test.com', res);
      expect(res.redirect).toHaveBeenCalledWith(
        302,
        'sponti://forgot-password?token=tok&email=e%40test.com',
      );
    });

    it('should redirect verify-email', () => {
      const res = { redirect: jest.fn() } as unknown as Response;
      controller.verifyEmailRedirect('tok', 'e@test.com', res);
      expect(res.redirect).toHaveBeenCalledWith(
        302,
        'sponti://verify-email?token=tok&email=e%40test.com',
      );
    });
  });
});