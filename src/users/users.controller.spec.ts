import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ParticipationsService } from 'src/participations/participations.service';
import { CurrentUserType } from 'src/utils/types/current-user.type';
import { UpdateUserDto } from './dto/update-user.dto';
import { UUID } from 'crypto';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    getProfile: jest.fn(),
    getUserMemories: jest.fn(),
    updateProfile: jest.fn(),
    deleteAccount: jest.fn(),
    getAccountDetails: jest.fn(),
  };

  const mockParticipationsService = {
    getUserActiveChallenges: jest.fn(),
    getUserAllCompletedCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: ParticipationsService, useValue: mockParticipationsService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('me', () => {
    it('should return profile, memories, activeChallenges and completedCount', async () => {
      const user: CurrentUserType = { userId: 'user-1' as UUID, email: 'test@test.com' };

      const profile = { id: user.userId, username: 'test' };
      const memories = { items: [], page: 1, perPage: 10 };
      const activeChallenges = [{ id: 'c1' }];
      const completedCount = 5;

      mockUsersService.getProfile.mockResolvedValue(profile);
      mockUsersService.getUserMemories.mockResolvedValue(memories);
      mockParticipationsService.getUserActiveChallenges.mockResolvedValue(
        activeChallenges,
      );
      mockParticipationsService.getUserAllCompletedCount.mockResolvedValue(
        completedCount,
      );

      const result = await controller.me(user);

      expect(result).toEqual({
        user: profile,
        memories,
        activeChallenges,
        completedCount,
      });

      expect(mockUsersService.getProfile).toHaveBeenCalledWith(user.userId);
      expect(mockUsersService.getUserMemories).toHaveBeenCalledWith(
        user.userId,
        1,
        10,
      );
      expect(
        mockParticipationsService.getUserActiveChallenges,
      ).toHaveBeenCalledWith(user.userId);
      expect(
        mockParticipationsService.getUserAllCompletedCount,
      ).toHaveBeenCalledWith(user.userId);
    });

    it('should respect memoryPage and memoryPerPage query params', async () => {
      const user: CurrentUserType = { userId: 'user-2' as UUID, email: 'test@test.com' };

      mockUsersService.getProfile.mockResolvedValue({});
      mockUsersService.getUserMemories.mockResolvedValue({});
      mockParticipationsService.getUserActiveChallenges.mockResolvedValue([]);
      mockParticipationsService.getUserAllCompletedCount.mockResolvedValue(0);

      await controller.me(user, 2, 5);

      expect(mockUsersService.getUserMemories).toHaveBeenCalledWith(
        user.userId,
        2,
        5,
      );
    });
  });

  describe('updateMe', () => {
    it('should update user profile', async () => {
      const user: CurrentUserType = { userId: 'user-3' as UUID, email: 'test@test.com' };
      const dto: UpdateUserDto = { username: 'newName' };

      const updated = { id: user.userId, username: 'newName' };

      mockUsersService.updateProfile.mockResolvedValue(updated);

      const result = await controller.updateMe(user, dto);

      expect(result).toEqual(updated);
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith(
        user.userId,
        dto,
      );
    });
  });

  describe('deleteMe', () => {
    it('should delete account and return confirmation', async () => {
      const user: CurrentUserType = { userId: 'user-4' as UUID, email: 'test@test.com' };

      mockUsersService.deleteAccount.mockResolvedValue(undefined);

      const result = await controller.deleteMe(user);

      expect(mockUsersService.deleteAccount).toHaveBeenCalledWith(user.userId);
      expect(result).toEqual({ message: 'Account deleted' });
    });
  });

  describe('getAccountDetails', () => {
    it('should return account details', async () => {
      const user: CurrentUserType = { userId: 'user-5' as UUID, email: 'test@test.com' };

      const details = { email: 'test@test.com', username: 'test' };

      mockUsersService.getAccountDetails.mockResolvedValue(details);

      const result = await controller.getAccountDetails(user);

      expect(result).toEqual(details);
      expect(mockUsersService.getAccountDetails).toHaveBeenCalledWith(
        user.userId,
      );
    });
  });
});