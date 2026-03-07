import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repo: Repository<User>;

  const mockQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  const mockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    manager: {
      getRepository: jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create service', () => {
    expect(service).toBeDefined();
  });

  it('getProfile returns user profile', async () => {
    const user = {
      id: '1',
      username: 'test',
      email: 'test@test.com',
      emailVerified: true,
      allowPublicImages: false,
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRepo.findOne.mockResolvedValue(user);

    const result = await service.getProfile('1' as any);

    expect(result.username).toBe('test');
    expect(result.email).toBe('test@test.com');
  });

  it('getProfile throws if user not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    await expect(service.getProfile('1' as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updateProfile changes username', async () => {
    const user = {
      id: '1',
      username: 'old',
      email: 'test@test.com',
      allowPublicImages: false,
    };

    mockRepo.findOne
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(null);

    mockRepo.save.mockResolvedValue(user);

    const result = await service.updateProfile('1' as any, {
      username: 'new',
    });

    expect(result.username).toBe('new');
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('updateProfile throws if username exists', async () => {
    const user = {
      id: '1',
      username: 'old',
      allowPublicImages: false,
    };

    mockRepo.findOne
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce({ id: '2' });

    await expect(
      service.updateProfile('1' as any, { username: 'taken' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updateProfile updates allowPublicImages', async () => {
    const user = {
      id: '1',
      username: 'test',
      email: 'test@test.com',
      allowPublicImages: false,
    };

    mockRepo.findOne.mockResolvedValue(user);
    mockRepo.save.mockResolvedValue(user);

    const result = await service.updateProfile('1' as any, {
      allowPublicImages: true,
    });

    expect(result.allowPublicImages).toBe(true);
  });

  it('deleteAccount removes user', async () => {
    const user = { id: '1' };

    mockRepo.findOne.mockResolvedValue(user);
    mockRepo.remove.mockResolvedValue(user);

    await service.deleteAccount('1' as any);

    expect(mockRepo.remove).toHaveBeenCalled();
  });

  it('getUserMemories returns images', async () => {
    const images = [{ imageUrl: 'img.jpg' }];

    mockQueryBuilder.getRawMany.mockResolvedValue(images);

    const result = await service.getUserMemories('1' as any);

    expect(result.items).toEqual(images);
    expect(result.page).toBe(1);
  });

  it('getAccountDetails returns details', async () => {
    const user = {
      id: '1',
      username: 'test',
      email: 'test@test.com',
      allowPublicImages: false,
      role: UserRole.USER,
    };

    mockRepo.findOne.mockResolvedValue(user);

    const result = await service.getAccountDetails('1' as any);

    expect(result.username).toBe('test');
    expect(result.email).toBe('test@test.com');
  });

  it('getAllUsers returns paginated result', async () => {
    const users = [{ id: '1', username: 'test' }];

    mockRepo.findAndCount.mockResolvedValue([users, 1]);

    const result = await service.getAllUsers(1, 10);

    expect(result.items.length).toBe(1);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('updateUserRole changes role', async () => {
    const user = {
      id: '2',
      role: UserRole.USER,
    };

    mockRepo.findOne.mockResolvedValue(user);
    mockRepo.save.mockResolvedValue(user);

    const result = await service.updateUserRole(
      '2' as any,
      UserRole.ADMIN,
      '1' as any,
    );

    expect(result.role).toBe(UserRole.ADMIN);
  });

  it('updateUserRole prevents self role change', async () => {
    const user: any = {
      id: '1',
      role: UserRole.ADMIN,
    };

    mockRepo.findOne.mockResolvedValue(user);

    await expect(
      service.updateUserRole('1' as any, UserRole.USER, '1' as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('updateUserRole throws if user not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    await expect(
      service.updateUserRole('1' as any, UserRole.ADMIN, '2' as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('updateUserRole returns if role is the same', async () => {
    const user = {
      id: '2',
      role: UserRole.ADMIN,
    };

    mockRepo.findOne.mockResolvedValue(user);

    const result = await service.updateUserRole(
      '2' as any,
      UserRole.ADMIN,
      '1' as any,
    );

    expect(result.role).toBe(UserRole.ADMIN);
  });

  it('deleteUser prevents deleting yourself', async () => {
    await expect(
      service.deleteUser('1' as any, '1' as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('deleteUser deletes user', async () => {
    const user = [{ id: '2' }];

    mockRepo.find.mockResolvedValue(user);
    mockRepo.remove.mockResolvedValue(user);

    const result = await service.deleteUser('2' as any, '1' as any);

    expect(result.message).toBe('User deleted successfully');
  });

  it('deleteUser throws if user not found', async () => {
    mockRepo.find.mockResolvedValue(null);

    await expect(
      service.deleteUser('2' as any, '1' as any),
    ).rejects.toThrow(NotFoundException);
  });
});