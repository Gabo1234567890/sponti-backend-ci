import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { ChallengesService } from 'src/challenges/challenges.service';
import { UsersService } from 'src/users/users.service';

describe('AdminController', () => {
  let controller: AdminController;

  const mockChallengesService = {
    getChallenges: jest.fn(),
    approve: jest.fn(),
    delete: jest.fn(),
  };

  const mockUsersService = {
    getAllUsers: jest.fn(),
    updateUserRole: jest.fn(),
    deleteUser: jest.fn(),
  };

  const mockAdmin = {
    userId: 'admin-id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: ChallengesService, useValue: mockChallengesService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get all users', async () => {
    const result = { users: [] };

    mockUsersService.getAllUsers.mockResolvedValue(result);

    const res = await controller.getAllUsers(1, 10);

    expect(mockUsersService.getAllUsers).toHaveBeenCalledWith(1, 10);
    expect(res).toEqual(result);
  });

  it('should update user role', async () => {
    const dto = { role: 'ADMIN' };
    const userId = 'user-id';
    const result = { success: true };

    mockUsersService.updateUserRole.mockResolvedValue(result);

    const res = await controller.patchUserRole(
      userId as any,
      dto as any,
      mockAdmin as any,
    );

    expect(mockUsersService.updateUserRole).toHaveBeenCalledWith(
      userId,
      dto.role,
      mockAdmin.userId,
    );
    expect(res).toEqual(result);
  });

  it('should delete user', async () => {
    const userId = 'user-id';
    const result = { deleted: true };

    mockUsersService.deleteUser.mockResolvedValue(result);

    const res = await controller.deleteUser(userId as any, mockAdmin as any);

    expect(mockUsersService.deleteUser).toHaveBeenCalledWith(
      userId,
      mockAdmin.userId,
    );
    expect(res).toEqual(result);
  });

  it('should get challenges with approved true', async () => {
    const result = { challenges: [] };

    mockChallengesService.getChallenges.mockResolvedValue(result);

    const res = await controller.getChallenges('true', 1, 20);

    expect(mockChallengesService.getChallenges).toHaveBeenCalledWith(
      true,
      1,
      20,
    );
    expect(res).toEqual(result);
  });

  it('should get challenges with approved false', async () => {
    const result = { challenges: [] };

    mockChallengesService.getChallenges.mockResolvedValue(result);

    const res = await controller.getChallenges('false', 1, 20);

    expect(mockChallengesService.getChallenges).toHaveBeenCalledWith(
      false,
      1,
      20,
    );
    expect(res).toEqual(result);
  });

  it('should get challenges with approved undefined', async () => {
    const result = { challenges: [] };

    mockChallengesService.getChallenges.mockResolvedValue(result);

    const res = await controller.getChallenges('invalid', 1, 20);

    expect(mockChallengesService.getChallenges).toHaveBeenCalledWith(
      undefined,
      1,
      20,
    );
    expect(res).toEqual(result);
  });

  it('should approve challenge', async () => {
    const id = 'challenge-id';
    const result = { approved: true };

    mockChallengesService.approve.mockResolvedValue(result);

    const res = await controller.approve(id as any);

    expect(mockChallengesService.approve).toHaveBeenCalledWith(id);
    expect(res).toEqual(result);
  });

  it('should delete challenge', async () => {
    const id = 'challenge-id';
    const result = { deleted: true };

    mockChallengesService.delete.mockResolvedValue(result);

    const res = await controller.delete(id as any);

    expect(mockChallengesService.delete).toHaveBeenCalledWith(id);
    expect(res).toEqual(result);
  });
});