import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../utils/guards/jwt-auth.guard';
import { ResetPasswordQueryDto } from './dto/reset-password-query.dto';
import { ResetPasswordRequestDto } from './dto/reset-password.request.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResetPasswordBodyDto } from './dto/reset-password-body.dto';
import { CurrentUser } from 'src/utils/decorators/current-user.decorator';
import type { CurrentUserType } from '../utils/types/current-user.type';
import type { Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  async signup(@Body() dto: CreateUserDto) {
    const user = await this.authService.signup(
      dto.username,
      dto.email,
      dto.password,
    );
    return { id: user.id, email: user.email };
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify user email' })
  async verifyEmail(@Query() query: VerifyEmailDto) {
    return this.authService.verifyEmail(query.email, query.token);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) throw new BadRequestException('Invalid Credentials');
    if (!user.emailVerified)
      throw new BadRequestException('Email not verified');
    return this.authService.login(user);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const payload = this.authService['jwtService'].verify(dto.refreshToken, {
      secret: this.authService['config'].get('JWT_REFRESH_TOKEN_SECRET'),
    });
    return this.authService.refreshTokens(payload.sub, dto.refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout' })
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: CurrentUserType) {
    await this.authService.logout(user.userId);
    return { message: 'Logged out' };
  }

  @Post('request-password-reset')
  @ApiOperation({ summary: 'Request to be sent an email for password reset' })
  async requestReset(@Body() dto: ResetPasswordRequestDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Set a new password to your account' })
  async reset(
    @Query() query: ResetPasswordQueryDto,
    @Body() body: ResetPasswordBodyDto,
  ) {
    return this.authService.resetPassword(
      query.email,
      query.token,
      body.password,
    );
  }

  @Get('reset-password-redirect')
  @ApiOperation({ summary: 'Redirect user to mobile app' })
  async resetPasswordRedirect(
    @Query('token') token: string,
    @Query('email') email: string,
    @Res() res: Response,
  ) {
    const uri = `sponti://forgot-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    return res.redirect(302, uri);
  }

  @Get('verify-email-redirect')
  @ApiOperation({ summary: 'Redirect user to mobile app' })
  async verifyEmailRedirect(
    @Query('token') token: string,
    @Query('email') email: string,
    @Res() res: Response,
  ) {
    const uri = `sponti://verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    return res.redirect(302, uri);
  }
}
