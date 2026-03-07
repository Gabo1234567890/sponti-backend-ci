import { Test, TestingModule } from '@nestjs/testing';
import { ParticipationsController } from './participations.controller';
import { ParticipationsService } from './participations.service';
import { BadRequestException } from '@nestjs/common';
import { CurrentUserType } from 'src/utils/types/current-user.type';
import { UUID } from 'crypto';

describe('ParticipationsController', () => {
  let controller: ParticipationsController;

  const mockParticipationsService = {
    startChallenge: jest.fn(),
    cancelChallenge: jest.fn(),
    completeChallenge: jest.fn(),
    addCompletionImages: jest.fn(),
    getUserCompletedCount: jest.fn(),
  };

  const user: CurrentUserType = {
    userId: 'user-1' as UUID,
    email: 'test@test.com',
  };

  const challengeId = 'challenge-1' as UUID;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParticipationsController],
      providers: [
        {
          provide: ParticipationsService,
          useValue: mockParticipationsService,
        },
      ],
    }).compile();

    controller = module.get<ParticipationsController>(
      ParticipationsController,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('start', () => {
    it('should start a challenge', async () => {
      const result = { success: true };

      mockParticipationsService.startChallenge.mockResolvedValue(result);

      const response = await controller.start(user, challengeId);

      expect(response).toEqual(result);
      expect(mockParticipationsService.startChallenge).toHaveBeenCalledWith(
        user.userId,
        challengeId,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel a challenge', async () => {
      const result = { success: true };

      mockParticipationsService.cancelChallenge.mockResolvedValue(result);

      const response = await controller.cancel(user, challengeId);

      expect(response).toEqual(result);
      expect(mockParticipationsService.cancelChallenge).toHaveBeenCalledWith(
        user.userId,
        challengeId,
      );
    });
  });

  describe('complete', () => {
    it('should complete a challenge', async () => {
      const result = { success: true };

      mockParticipationsService.completeChallenge.mockResolvedValue(result);

      const response = await controller.complete(user, challengeId);

      expect(response).toEqual(result);
      expect(mockParticipationsService.completeChallenge).toHaveBeenCalledWith(
        user.userId,
        challengeId,
      );
    });
  });

  describe('uploadImages', () => {
    it('should throw if no images uploaded', async () => {
      await expect(
        controller.uploadImages(user, challengeId, []),
      ).rejects.toThrow(BadRequestException);
    });

    it('should upload completion images', async () => {
      const images = [
        { filename: 'img1.jpg' },
        { filename: 'img2.jpg' },
      ] as Express.Multer.File[];

      const result = { uploaded: true };

      mockParticipationsService.addCompletionImages.mockResolvedValue(result);

      const response = await controller.uploadImages(user, challengeId, images);

      expect(response).toEqual(result);

      expect(
        mockParticipationsService.addCompletionImages,
      ).toHaveBeenCalledWith(user.userId, challengeId, images);
    });
  });

  describe('completedCountById', () => {
    it('should return completed count for challenge', async () => {
      const result = { count: 3 };

      mockParticipationsService.getUserCompletedCount.mockResolvedValue(result);

      const response = await controller.completedCountById(user, challengeId);

      expect(response).toEqual(result);

      expect(
        mockParticipationsService.getUserCompletedCount,
      ).toHaveBeenCalledWith(user.userId, challengeId);
    });
  });
});