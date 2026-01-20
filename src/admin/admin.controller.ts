import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { UUID } from 'crypto';
import { ChallengesService } from 'src/challenges/challenges.service';
import { UsersService } from 'src/users/users.service';
import { AdminGuard } from 'src/utils/guards/admin.guard';
import { JwtAuthGuard } from 'src/utils/guards/jwt-auth.guard';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CurrentUser } from 'src/utils/decorators/current-user.decorator';
import type { CurrentUserType } from 'src/utils/types/current-user.type';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private challengesService: ChallengesService,
    private usersService: UsersService,
  ) {}

  @Get('users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  async getAllUsers(@Query('page') page = 1, @Query('perPage') perPage = 10) {
    return this.usersService.getAllUsers(page, perPage);
  }

  @Patch('users/:id/role')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  async patchUserRole(
    @Param('id') userId: UUID,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() admin: CurrentUserType,
  ) {
    return this.usersService.updateUserRole(userId, dto.role, admin.userId);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  async deleteUser(
    @Param('id') userId: UUID,
    @CurrentUser() admin: CurrentUserType,
  ) {
    return this.usersService.deleteUser(userId, admin.userId);
  }

  @Get('challenges/pending')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'approved', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  async getPendingChallenges(
    @Query('approved') approved: string,
    @Query('page') page = 1,
    @Query('perPage') perPage = 20,
  ) {
    return this.challengesService.getPendingChallenges(
      approved === 'true' ? true : approved === 'false' ? false : undefined,
      page,
      perPage,
    );
  }

  @Patch('challenges/:id/approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  async approve(@Param('id') id: UUID) {
    return this.challengesService.approve(id);
  }

  @Delete('challenges/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  async delete(@Param('id') id: UUID) {
    return this.challengesService.delete(id);
  }
}
