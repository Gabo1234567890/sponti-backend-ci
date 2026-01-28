import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class ResetPasswordQueryDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsEmail()
  email: string;
}
