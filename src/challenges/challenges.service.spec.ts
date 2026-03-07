import { Test, TestingModule } from '@nestjs/testing';
import { ChallengesService } from './challenges.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from './entities/challenge.entity';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ChallengesService', () => {
  let service: ChallengesService;
  let repo: Repository<Challenge>;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue('http://localhost:3000'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengesService,
        {
          provide: getRepositoryToken(Challenge),
          useValue: mockRepo,
        },
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<ChallengesService>(ChallengesService);
    repo = module.get<Repository<Challenge>>(getRepositoryToken(Challenge));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create service', () => {
    expect(service).toBeDefined();
  });

  it('submitChallenge creates challenge', async () => {
    const dto = { title: 'test challenge' } as any;

    const challenge = { id: '1', ...dto };

    mockRepo.create.mockReturnValue(challenge);
    mockRepo.save.mockResolvedValue(challenge);

    const result = await service.submitChallenge(dto, '1' as any, null);

    expect(result).toEqual(challenge);
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('submitChallenge adds thumbnail url', async () => {
    const dto = { title: 'test challenge' } as any;

    const file = {
      filename: 'thumb.png',
    } as any;

    const challenge = { id: '1', ...dto };

    mockRepo.create.mockReturnValue(challenge);
    mockRepo.save.mockResolvedValue(challenge);

    await service.submitChallenge(dto, '1' as any, file);

    expect(mockRepo.create).toHaveBeenCalled();
  });

  it('listApproved returns paginated challenges', async () => {
    mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    const result = await service.listApproved({}, 1, 10);

    expect(result.items).toEqual([]);
    expect(result.count).toBe(0);
  });

  it('listApproved throws if minPrice > maxPrice', async () => {
    await expect(
      service.listApproved({ minPrice: 10, maxPrice: 5 }, 1, 10),
    ).rejects.toThrow(BadRequestException);
  });

  it('listApproved throws if minDuration > maxDuration', async () => {
    await expect(
      service.listApproved({ minDuration: 50, maxDuration: 10 }, 1, 10),
    ).rejects.toThrow(BadRequestException);
  });

  it('findById returns challenge', async () => {
    const chal = { id: '1' };

    mockRepo.findOne.mockResolvedValue(chal);

    const result = await service.findById('1' as any);

    expect(result).toEqual(chal);
  });

  it('findById throws if not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    await expect(service.findById('1' as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('getChallenges returns paginated challenges', async () => {
    const items = [{ id: '1', title: 'test' }];

    mockRepo.findAndCount.mockResolvedValue([items, 1]);

    const result = await service.getChallenges(true, 1, 10);

    expect(result.items.length).toBe(1);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('getChallenges throws if approved undefined', async () => {
    await expect(service.getChallenges(undefined, 1, 10)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('approve sets challenge approved', async () => {
    const chal = { id: '1', approved: false };

    mockRepo.findOne.mockResolvedValue(chal);
    mockRepo.save.mockResolvedValue(chal);

    const result = await service.approve('1' as any);

    expect(result.approved).toBe(true);
  });

  it('delete removes challenge', async () => {
    const chal = { id: '1' };

    mockRepo.findOne.mockResolvedValue(chal);
    mockRepo.remove.mockResolvedValue(chal);

    const result = await service.delete('1' as any);

    expect(result.message).toBe('Challenge deleted successfully');
  });
});