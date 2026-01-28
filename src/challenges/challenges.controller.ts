import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';
import { JwtAuthGuard } from 'src/utils/guards/jwt-auth.guard';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { CurrentUser } from 'src/utils/decorators/current-user.decorator';
import type { CurrentUserType } from 'src/utils/types/current-user.type';
import type { UUID } from 'crypto';
import { ListChallengesQueryDto } from './dto/list-challenges-query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 } from 'uuid';
import { PlaceType, Vehicle } from './entities/challenge.entity';
import { ParticipationsService } from 'src/participations/participations.service';

@ApiTags('challenges')
@Controller('challenges')
export class ChallengesController {
  constructor(
    private challengesService: ChallengesService,
    private participationsService: ParticipationsService,
  ) {}

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage: diskStorage({
        destination: './uploads/thumbnails',
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
        thumbnail: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        durationMinutes: { type: 'number' },
        place: { type: 'string' },
        vehicle: { type: 'string', enum: Object.values(Vehicle) },
        placeType: { type: 'string', enum: Object.values(PlaceType) },
      },
    },
  })
  async submit(
    @UploadedFile() thumbnail: Express.Multer.File | null,
    @Body() dto: CreateChallengeDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.challengesService.submitChallenge(dto, user.userId, thumbnail);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async list(@Query() query: ListChallengesQueryDto) {
    return this.challengesService.listApproved(
      query,
      query.page,
      query.perPage,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'completionImagesPage', required: false, type: Number })
  @ApiQuery({ name: 'completionImagesPerPage', required: false, type: Number })
  async get(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: UUID,
    @Query('completionImagesPage') completionImagesPage = 1,
    @Query('completionImagesPerPage') completionImagesPerPage = 10,
  ) {
    const [challenge, publicCompletionImages, status] = await Promise.all([
      this.challengesService.findById(id),
      this.participationsService.getPublicCompletionImages(
        id,
        completionImagesPage,
        completionImagesPerPage,
      ),
      this.participationsService.getStatus(user.userId, id),
    ]);
    return { challenge, publicCompletionImages, status };
  }
}
