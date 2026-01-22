import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Challenge } from './entities/challenge.entity';
import { Repository } from 'typeorm';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UUID } from 'crypto';
import { Filters } from './types/filters.type';
import { ConfigService } from '@nestjs/config';
import { Participation } from 'src/participations/entities/participation.entity';

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge) private repo: Repository<Challenge>,
    private config: ConfigService,
  ) {}

  async submitChallenge(
    dto: CreateChallengeDto,
    userId: UUID,
    thumbnail: Express.Multer.File | null,
  ) {
    const challenge = this.repo.create({
      ...dto,
      submittedByUserId: userId,
      thumbnailUrl:
        thumbnail != null
          ? `${this.config.get('API_URL')}/uploads/thumbnails/${thumbnail.filename}`
          : undefined,
      approved: false,
    });
    return this.repo.save(challenge);
  }

  async listApproved(filters: Filters, page = 1, perPage = 20) {
    const qb = this.repo
      .createQueryBuilder('chal')
      .where('chal.approved = true');

    if (
      filters.minPrice &&
      filters.maxPrice &&
      filters.minPrice > filters.maxPrice
    )
      throw new BadRequestException(
        'Min price cannot be greater than max price',
      );

    if (
      filters.minDuration &&
      filters.maxDuration &&
      filters.minDuration > filters.maxDuration
    )
      throw new BadRequestException(
        'Min duration cannot be greater than max duration',
      );

    if (filters.minPrice !== undefined && filters.minPrice >= 0)
      qb.andWhere('chal.price >= :min', { min: filters.minPrice });
    if (filters.maxPrice !== undefined && filters.maxPrice >= 0)
      qb.andWhere('chal.price <= :max', { max: filters.maxPrice });

    if (filters.minDuration !== undefined && filters.minDuration >= 0)
      qb.andWhere('chal.durationMinutes >= :minDuration', {
        minDuration: filters.minDuration,
      });
    if (filters.maxDuration !== undefined && filters.maxDuration >= 0)
      qb.andWhere('chal.durationMinutes <= :maxDuration', {
        maxDuration: filters.maxDuration,
      });

    if (filters.vehicles?.length)
      qb.andWhere('chal.vehicle IN (:...vehicles)', {
        vehicles: filters.vehicles,
      });

    if (filters.placeTypes?.length)
      qb.andWhere('chal.placeType IN (:...placeTypes)', {
        placeTypes: filters.placeTypes,
      });

    qb.orderBy('chal.createdAt', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage);

    const [items, count] = await qb.getManyAndCount();
    return { items, count, page, perPage };
  }

  async findById(id: UUID) {
    const chal = await this.repo.findOne({ where: { id } });
    if (!chal) throw new NotFoundException('Challenge not found');
    return chal;
  }

  async getChallenges(approved?: boolean, page = 1, perPage = 20) {
    if (approved === undefined) {
      throw new BadRequestException('Invalid approved value');
    }

    const [items, total] = await this.repo.findAndCount({
      where: { approved: approved },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        price: true,
        durationMinutes: true,
        place: true,
        vehicle: true,
        submittedByUserId: true,
        createdAt: true,
      },
    });

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async approve(id: UUID) {
    const chal = await this.findById(id);
    chal.approved = true;
    return this.repo.save(chal);
  }

  async delete(id: UUID) {
    const chal = await this.findById(id);
    await this.repo.remove(chal);
    return { message: 'Challenge deleted successfully' };
  }
}
