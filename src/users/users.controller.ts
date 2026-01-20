import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Body,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/utils/guards/jwt-auth.guard';
import { CurrentUser } from 'src/utils/decorators/current-user.decorator';
import type { CurrentUserType } from 'src/utils/types/current-user.type';
import { UpdateUserDto } from './dto/update-user.dto';
import { ParticipationsService } from 'src/participations/participations.service';

@ApiTags('users')
@Controller('user')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private partService: ParticipationsService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'memoryPage', required: false, type: Number })
  @ApiQuery({ name: 'memoryPerPage', required: false, type: Number })
  async me(
    @CurrentUser() user: CurrentUserType,
    @Query('memoryPage') memoryPage = 1,
    @Query('memoryPerPage') memoryPerPage = 10,
  ) {
    const [profile, memories, activeChallenges, completedCount] =
      await Promise.all([
        this.usersService.getProfile(user.userId),
        this.usersService.getUserMemories(
          user.userId,
          +memoryPage,
          +memoryPerPage,
        ),
        this.partService.getUserActiveChallenges(user.userId),
        this.partService.getUserAllCompletedCount(user.userId),
      ]);
    return {
      user: profile,
      memories,
      activeChallenges,
      completedCount,
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateMe(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deleteMe(@CurrentUser() user: CurrentUserType) {
    await this.usersService.deleteAccount(user.userId);
    return { message: 'Account deleted' };
  }

  @Get('memories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMemories(
    @CurrentUser() user: CurrentUserType,
    @Query('page') page = 1,
    @Query('perPage') perPage = 10,
  ) {
    return this.usersService.getUserMemories(user.userId, +page, +perPage);
  }

  @Get('account-details')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getAccountDetails(@CurrentUser() user: CurrentUserType) {
    return this.usersService.getAccountDetails(user.userId);
  }
}
