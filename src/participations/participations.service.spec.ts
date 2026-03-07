import { Test, TestingModule } from '@nestjs/testing';
import { ParticipationsService } from './participations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participation } from './entities/participation.entity';
import { CompletionImage } from './entities/completion-image.entity';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ParticipationsService', () => {
  let service: ParticipationsService;

  const mockQB = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  const mockParticipationRepo = {
    count: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQB),
  };

  const mockImgRepo = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQB),
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'MAX_ACTIVE_CHALLENGES') return 3;
      if (key === 'MAX_IMAGES_ON_COMPLETION') return 5;
      if (key === 'API_URL') return 'http://localhost:3000';
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipationsService,
        {
          provide: getRepositoryToken(Participation),
          useValue: mockParticipationRepo,
        },
        {
          provide: getRepositoryToken(CompletionImage),
          useValue: mockImgRepo,
        },
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<ParticipationsService>(ParticipationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create service', () => {
    expect(service).toBeDefined();
  });

  it('startChallenge creates new participation', async () => {
    mockParticipationRepo.count.mockResolvedValue(0);
    mockParticipationRepo.findOne.mockResolvedValue(null);

    const participation = { id: '1' };

    mockParticipationRepo.create.mockReturnValue(participation);
    mockParticipationRepo.save.mockResolvedValue(participation);

    const result = await service.startChallenge('1' as any, '2' as any);

    expect(result).toEqual(participation);
  });

  it('startChallenge throws when max active reached', async () => {
    mockParticipationRepo.count.mockResolvedValue(3);

    await expect(
      service.startChallenge('1' as any, '2' as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('startChallenge throws if already active', async () => {
    mockParticipationRepo.count.mockResolvedValue(0);
    mockParticipationRepo.findOne.mockResolvedValue({ isActive: true });

    await expect(
      service.startChallenge('1' as any, '2' as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('cancelChallenge cancels active challenge', async () => {
    const p = { isActive: true };

    mockParticipationRepo.findOne.mockResolvedValue(p);
    mockParticipationRepo.save.mockResolvedValue(p);

    const result = await service.cancelChallenge('1' as any, '2' as any);

    expect(result).toEqual(p);
  });

  it('cancelChallenge throws if participation not found', async () => {
    mockParticipationRepo.findOne.mockResolvedValue(null);

    await expect(
      service.cancelChallenge('1' as any, '2' as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('completeChallenge increments completion count', async () => {
    const p = { isActive: true, completionCount: 1 };

    mockParticipationRepo.findOne.mockResolvedValue(p);
    mockParticipationRepo.save.mockResolvedValue(p);

    const result = await service.completeChallenge('1' as any, '2' as any);

    expect(result.completionCount).toBe(2);
  });

  it('completeChallenge throws if not active', async () => {
    mockParticipationRepo.findOne.mockResolvedValue({ isActive: false });

    await expect(
      service.completeChallenge('1' as any, '2' as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('addCompletionImages saves images', async () => {
    const images = [{ filename: 'img1.png' }] as any;

    const entity = { url: 'test' };

    mockImgRepo.create.mockReturnValue(entity);
    mockImgRepo.save.mockResolvedValue([entity]);

    const result = await service.addCompletionImages(
      '1' as any,
      '2' as any,
      images,
    );

    expect(result.length).toBe(1);
  });

  it('addCompletionImages throws when image cap exceeded', async () => {
    const images = new Array(10).fill({ filename: 'img.png' });

    await expect(
      service.addCompletionImages('1' as any, '2' as any, images),
    ).rejects.toThrow(BadRequestException);
  });

  it('getUserActiveChallenges returns challenges', async () => {
    mockQB.getRawMany.mockResolvedValue([{ id: '1', title: 'test' }]);

    const result = await service.getUserActiveChallenges('1' as any);

    expect(result.length).toBe(1);
  });

  it('getUserAllCompletedCount sums completions', async () => {
    mockParticipationRepo.find.mockResolvedValue([
      { completionCount: 1 },
      { completionCount: 2 },
    ]);

    const result = await service.getUserAllCompletedCount('1' as any);

    expect(result).toBe(3);
  });

  it('getUserCompletedCount returns completion count', async () => {
    mockParticipationRepo.findOne.mockResolvedValue({
      completionCount: 5,
    });

    const result = await service.getUserCompletedCount('1' as any, '2' as any);

    expect(result).toBe(5);
  });

  it('getUserCompletedCount throws if not found', async () => {
    mockParticipationRepo.findOne.mockResolvedValue(null);

    await expect(
      service.getUserCompletedCount('1' as any, '2' as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('getPublicCompletionImages returns images', async () => {
    mockQB.getRawMany.mockResolvedValue([
      { userId: '1', url: 'img1' },
      { userId: '1', url: 'img2' },
      { userId: '2', url: 'img3' },
    ]);

    const result = await service.getPublicCompletionImages('1' as any);

    expect(result.items.length).toBeGreaterThan(0);
  });

  it('getStatus returns empty status when participation not found', async () => {
    mockParticipationRepo.findOne.mockResolvedValue(null);

    const result = await service.getStatus('1' as any, '2' as any);

    expect(result.exists).toBe(false);
  });

  it('getStatus returns participation status', async () => {
    const p = {
      isActive: true,
      completionCount: 2,
      startedAt: new Date(),
    };

    mockParticipationRepo.findOne.mockResolvedValue(p);

    const result = await service.getStatus('1' as any, '2' as any);

    expect(result.exists).toBe(true);
  });
});