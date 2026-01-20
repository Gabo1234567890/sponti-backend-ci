import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ParticipationsService } from './participations.service';
import { JwtAuthGuard } from 'src/utils/guards/jwt-auth.guard';
import { CurrentUser } from 'src/utils/decorators/current-user.decorator';
import type { CurrentUserType } from 'src/utils/types/current-user.type';
import type { UUID } from 'crypto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 } from 'uuid';

@ApiTags('participations')
@Controller('participations')
export class ParticipationsController {
  constructor(private participationsService: ParticipationsService) {}

  @Post(':challengeId/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async start(
    @CurrentUser() user: CurrentUserType,
    @Param('challengeId') challengeId: UUID,
  ) {
    return this.participationsService.startChallenge(user.userId, challengeId);
  }

  @Patch(':challengeId/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async cancel(
    @CurrentUser() user: CurrentUserType,
    @Param('challengeId') challengeId: UUID,
  ) {
    return this.participationsService.cancelChallenge(user.userId, challengeId);
  }

  @Patch(':challengeId/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async complete(
    @CurrentUser() user: CurrentUserType,
    @Param('challengeId') challengeId: UUID,
  ) {
    return this.participationsService.completeChallenge(
      user.userId,
      challengeId,
    );
  }

  @Post(':challengeId/images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FilesInterceptor('images', 3, {
      storage: diskStorage({
        destination: './uploads/completions',
        filename: (_req, file, cb) => {
          const ext = file.originalname.split('.').pop();
          cb(null, v4() + '.' + ext);
        },
      }),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  async uploadImages(
    @CurrentUser() user: CurrentUserType,
    @Param('challengeId') challengeId: UUID,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    if (!images || images.length === 0)
      throw new BadRequestException('No images uploaded');

    return this.participationsService.addCompletionImages(
      user.userId,
      challengeId,
      images,
    );
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async activeParticipations(@CurrentUser() user: CurrentUserType) {
    return this.participationsService.getUserActiveChallenges(user.userId);
  }

  @Get('completed-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async allCompletedCount(@CurrentUser() user: CurrentUserType) {
    return this.participationsService.getUserAllCompletedCount(user.userId);
  }

  @Get(':challengeId/completed-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async completedCountById(
    @CurrentUser() user: CurrentUserType,
    @Param('challengeId') challengeId: UUID,
  ) {
    return this.participationsService.getUserCompletedCount(
      user.userId,
      challengeId,
    );
  }

  @Get(':challengeId/public-images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async publicImages(
    @Param('challengeId') challengeId: UUID,
    @Query('page') page = 1,
    @Query('perPage') perPage = 10,
  ) {
    return this.participationsService.getPublicCompletionImages(
      challengeId,
      +page,
      +perPage,
    );
  }

  @Get(':challengeId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async status(
    @CurrentUser() user: CurrentUserType,
    @Param('challengeId') challengeId: UUID,
  ) {
    return this.participationsService.getStatus(user.userId, challengeId);
  }
}
