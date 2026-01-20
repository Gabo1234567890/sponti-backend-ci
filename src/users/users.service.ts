import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UUID } from 'crypto';
import type { UserProfileResponse } from './types/profile-response.type';
import { CompletionImage } from 'src/participations/entities/completion-image.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  private async findById(userId: UUID) {
    const user = await this.repo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async getProfile(userId: UUID): Promise<UserProfileResponse> {
    const user = await this.findById(userId);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      allowPublicImages: user.allowPublicImages,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(
    userId: UUID,
    data: { username?: string; allowPublicImages?: boolean },
  ) {
    const user = await this.findById(userId);

    if (data.username && data.username !== user.username) {
      const exists = await this.repo.findOne({
        where: { username: data.username },
      });
      if (exists) throw new BadRequestException('Username already taken');
      user.username = data.username;
    }

    if (
      data.allowPublicImages !== undefined &&
      data.allowPublicImages !== user.allowPublicImages
    ) {
      user.allowPublicImages = data.allowPublicImages;
    }

    await this.repo.save(user);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      allowPublicImages: user.allowPublicImages,
    };
  }

  async deleteAccount(userId: UUID) {
    const user = await this.findById(userId);
    await this.repo.remove(user);
  }

  async getUserMemories(userId: UUID, page = 1, perPage = 10) {
    const qb = this.repo.manager
      .getRepository(CompletionImage)
      .createQueryBuilder('img')
      .innerJoin('challenges', 'chal', 'chal.id = img.challengeId')
      .where('img.userId = :userId', { userId })
      .orderBy('img.uploadedAt', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .select([
        'img.url AS "imageUrl"',
        'img.uploadedAt AS "uploadedAt"',
        'chal.id AS "challengeId"',
        'chal.title AS "challengeTitle"',
      ]);

    const items = await qb.getRawMany();
    return { items, page, perPage };
  }

  async getAccountDetails(userId: UUID) {
    const user = await this.findById(userId);
    return {
      username: user.username,
      email: user.email,
      allowPublicImages: user.allowPublicImages,
      role: user.role,
    };
  }

  async getAllUsers(page = 1, perPage = 10) {
    const [items, total] = await this.repo.findAndCount({
      order: { createdAt: 'ASC' },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        username: true,
        email: true,
        allowPublicImages: true,
        role: true,
        emailVerified: true,
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

  async updateUserRole(userId: UUID, newRole: UserRole, adminId: UUID) {
    const user = await this.repo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.id === adminId) {
      throw new BadRequestException('You cannot change your own role');
    }

    if (user.role === newRole) {
      return {
        id: user.id,
        role: user.role,
      };
    }

    user.role = newRole;
    await this.repo.save(user);

    return {
      id: user.id,
      role: user.role,
    };
  }

  async deleteUser(userId: UUID, adminId: UUID) {
    if (userId === adminId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const user = await this.repo.find({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.repo.remove(user);

    return { message: 'User deleted successfully' };
  }
}
