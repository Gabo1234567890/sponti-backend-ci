import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UUID } from 'crypto';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from 'src/users/entities/user.entity';

interface JwtPayload {
  sub: UUID,
  email: string,
  role: UserRole
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private cs: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: cs.get('JWT_ACCESS_TOKEN_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
