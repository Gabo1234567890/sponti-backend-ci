import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Participation } from './entities/participation.entity';
import { Repository } from 'typeorm';
import { CompletionImage } from './entities/completion-image.entity';
import { UUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Challenge } from 'src/challenges/entities/challenge.entity';

@Injectable()
export class ParticipationsService {
  constructor(
    @InjectRepository(Participation)
    private participationRepo: Repository<Participation>,
    @InjectRepository(CompletionImage)
    private imgRepo: Repository<CompletionImage>,
    private config: ConfigService,
  ) {}

  async startChallenge(userId: UUID, challengeId: UUID) {
    const activeCount = await this.participationRepo.count({
      where: { userId, isActive: true },
    });

    if (activeCount >= this.config.get('MAX_ACTIVE_CHALLENGES'))
      throw new BadRequestException(
        `Max ${this.config.get('MAX_ACTIVE_CHALLENGES')} active challenges allowed`,
      );

    const p = await this.participationRepo.findOne({
      where: { userId, challengeId },
    });

    if (!p) {
      const newP = this.participationRepo.create({
        userId,
        challengeId,
        isActive: true,
        startedAt: new Date(),
        completionCount: 0,
      });

      return this.participationRepo.save(newP);
    }

    if (p.isActive) throw new BadRequestException('Challenge already active');

    p.isActive = true;
    p.startedAt = new Date();
    return this.participationRepo.save(p);
  }

  async cancelChallenge(userId: UUID, challengeId: UUID) {
    const p = await this.participationRepo.findOne({
      where: { challengeId, userId },
    });

    if (!p) throw new NotFoundException('Participation not found');
    if (!p.isActive)
      throw new BadRequestException('Cannot cancel non-active challenge');

    p.isActive = false;
    return this.participationRepo.save(p);
  }

  async completeChallenge(userId: UUID, challengeId: UUID) {
    const p = await this.participationRepo.findOne({
      where: { challengeId, userId },
    });

    if (!p) throw new NotFoundException('Participation not found');
    if (!p.isActive)
      throw new BadRequestException('Cannot complete non-active challenge');

    p.isActive = false;
    p.completionCount = (p.completionCount || 0) + 1;

    return this.participationRepo.save(p);
  }

  async addCompletionImages(
    userId: UUID,
    challengeId: UUID,
    images: Express.Multer.File[],
  ) {
    if (images.length > this.config.get('MAX_IMAGES_ON_COMPLETION'))
      throw new BadRequestException('Image cap exceeded');

    const entities = images.map((img) =>
      this.imgRepo.create({
        userId,
        challengeId,
        url: `${this.config.get('API_URL')}/uploads/completions/${img.filename}`,
        uploadedAt: new Date(),
      }),
    );

    return this.imgRepo.save(entities);
  }

  async getUserActiveChallenges(userId: UUID) {
    return this.participationRepo
      .createQueryBuilder('part')
      .innerJoin(Challenge, 'chal', 'chal.id = part.challengeId')
      .where('part.userId = :userId', { userId })
      .andWhere('part.isActive = true')
      .select([
        'chal.id AS "id"',
        'chal.title AS "title"',
        'chal.description AS "description"',
        'chal.thumbnailUrl AS "thumbnailUrl"',
        'chal.price AS "price"',
        'chal.durationMinutes AS "durationMinutes"',
        'chal.place AS "place"',
        'chal.vehicle AS "vehicle"',
        'chal.placeType AS "placeType"',
        'chal.approved AS "approved"',
        'chal.submittedByUserId AS "submittedByUserId"',
        'chal.createdAt AS "createdAt"',
        'chal.updatedAt AS "updatedAt"',
      ])
      .getRawMany();
  }

  async getUserAllCompletedCount(userId: UUID) {
    const participations = await this.participationRepo.find({
      where: { userId },
    });

    const completions = participations.map((p) => p.completionCount);

    return completions.reduce((prev, curr) => prev + curr, 0);
  }

  async getUserCompletedCount(userId: UUID, challengeId: UUID) {
    const p = await this.participationRepo.findOne({
      where: { userId, challengeId },
    });

    if (!p) throw new NotFoundException('Participation not found');

    return p.completionCount;
  }

  async getPublicCompletionImages(challengeId: UUID, page = 1, perPage = 10) {
    const qb = this.imgRepo
      .createQueryBuilder('img')
      .innerJoin('users', 'u', 'u.id = img.userId')
      .where('img.challengeId = :challengeId', { challengeId })
      .andWhere('u.allowPublicImages = true')
      .orderBy('img.uploadedAt', 'DESC')
      .select([
        'img.userId AS "userId"',
        'img.url AS "url"',
        'img.uploadedAt AS "uploadedAt"',
      ]);

    const allImages = await qb.getRawMany<{userId: UUID, url: string, uploadedAt: Date}>();

    const unique = new Map();
    for (const img of allImages) {
      if (!unique.has(img.userId)) {
        unique.set(img.userId, img);
      }
    }

    const items = Array.from(unique.values());
    const paginated = items.slice((page - 1) * page * perPage);

    return { items: paginated, page, perPage };
  }

  async getStatus(userId: UUID, challengeId: UUID) {
    const p = await this.participationRepo.findOne({
      where: { userId, challengeId },
    });

    if (!p) {
      return {
        exists: false,
        isActive: false,
        completionCount: 0,
        startedAt: null,
      };
    }

    return {
      exists: true,
      isActive: p.isActive,
      completionCount: p.completionCount,
      startedAt: p.startedAt,
    };
  }
}
