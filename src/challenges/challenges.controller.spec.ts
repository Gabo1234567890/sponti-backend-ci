import { Test, TestingModule } from '@nestjs/testing';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';
import { ParticipationsService } from 'src/participations/participations.service';
import { CurrentUserType } from 'src/utils/types/current-user.type';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { ListChallengesQueryDto } from './dto/list-challenges-query.dto';
import { UUID } from 'crypto';
import { PlaceType, Vehicle } from './entities/challenge.entity';

describe('ChallengesController', () => {
  let controller: ChallengesController;
  let challengesService: ChallengesService;
  let participationsService: ParticipationsService;

  const mockChallengesService = {
    submitChallenge: jest.fn(),
    listApproved: jest.fn(),
    findById: jest.fn(),
  };

  const mockParticipationsService = {
    getPublicCompletionImages: jest.fn(),
    getStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChallengesController],
      providers: [
        { provide: ChallengesService, useValue: mockChallengesService },
        { provide: ParticipationsService, useValue: mockParticipationsService },
      ],
    }).compile();

    controller = module.get<ChallengesController>(ChallengesController);
    challengesService = module.get<ChallengesService>(ChallengesService);
    participationsService = module.get<ParticipationsService>(ParticipationsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('submit', () => {
    it('should call submitChallenge with proper params', async () => {
      const user: CurrentUserType = { userId: 'user-1' as UUID, email: 'test@test.com' };
      const dto: CreateChallengeDto = {
        title: 'Test Challenge',
        description: 'desc',
        price: 10,
        durationMinutes: 15,
        place: 'Park',
        vehicle: Vehicle.CAR,
        placeType: PlaceType.INDOOR,
      };
      const thumbnail: Express.Multer.File = { filename: 'thumb.png' } as any;

      mockChallengesService.submitChallenge.mockResolvedValue({ id: '1', ...dto });

      const result = await controller.submit(thumbnail, dto, user);
      expect(result).toEqual({ id: '1', ...dto });
      expect(mockChallengesService.submitChallenge).toHaveBeenCalledWith(dto, user.userId, thumbnail);
    });
  });

  describe('list', () => {
    it('should call listApproved with query params', async () => {
      const query: ListChallengesQueryDto = { page: 1, perPage: 10 };
      mockChallengesService.listApproved.mockResolvedValue({ items: [], count: 0, page: 1, perPage: 10 });

      const result = await controller.list(query);
      expect(result).toEqual({ items: [], count: 0, page: 1, perPage: 10 });
      expect(mockChallengesService.listApproved).toHaveBeenCalledWith(query, query.page, query.perPage);
    });
  });

  describe('get', () => {
    it('should return challenge, publicCompletionImages and status', async () => {
      const user: CurrentUserType = { userId: 'user-1' as UUID, email: 'test@test.com' };
      const challengeId = 'chal-1' as UUID;

      const mockChallenge = { id: challengeId, title: 'Test' };
      const mockImages = { items: [], page: 1, perPage: 10 };
      const mockStatus = { exists: true, isActive: false, completionCount: 0, startedAt: null };

      mockChallengesService.findById.mockResolvedValue(mockChallenge);
      mockParticipationsService.getPublicCompletionImages.mockResolvedValue(mockImages);
      mockParticipationsService.getStatus.mockResolvedValue(mockStatus);

      const result = await controller.get(user, challengeId);
      expect(result).toEqual({
        challenge: mockChallenge,
        publicCompletionImages: mockImages,
        status: mockStatus,
      });

      expect(mockChallengesService.findById).toHaveBeenCalledWith(challengeId);
      expect(mockParticipationsService.getPublicCompletionImages).toHaveBeenCalledWith(challengeId, 1, 10);
      expect(mockParticipationsService.getStatus).toHaveBeenCalledWith(user.userId, challengeId);
    });

    it('should use provided page/perPage for publicCompletionImages', async () => {
      const user: CurrentUserType = { userId: 'user-1' as UUID, email: 'test@test.com' };
      const challengeId = 'chal-2' as UUID;

      mockChallengesService.findById.mockResolvedValue({ id: challengeId });
      mockParticipationsService.getPublicCompletionImages.mockResolvedValue({ items: [], page: 2, perPage: 5 });
      mockParticipationsService.getStatus.mockResolvedValue({ exists: true });

      const result = await controller.get(user, challengeId, 2, 5);
      expect(result.publicCompletionImages.page).toBe(2);
      expect(result.publicCompletionImages.perPage).toBe(5);
      expect(mockParticipationsService.getPublicCompletionImages).toHaveBeenCalledWith(challengeId, 2, 5);
    });
  });
});