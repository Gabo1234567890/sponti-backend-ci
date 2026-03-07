import { Repository } from "typeorm";
import { AuthService } from "./auth.service";
import { User } from "src/users/entities/user.entity";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { MailService } from "src/mail/mail.service";
import argon2 from "argon2";

describe("AuthService", () => {
  let service: AuthService;
  let repo: Repository<User>;

  const mockRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue("token"),
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue("secret"),
  };

  const mockMail = {
    sendVerificationEmail: jest.fn(),
    sendResetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: MailService, useValue: mockMail },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repo = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create service", () => {
    expect(service).toBeDefined();
  });

  it("should signup user", async () => {
    mockRepo.findOne.mockResolvedValueOnce(null);
    mockRepo.findOne.mockResolvedValueOnce(null);

    const user = { id: "1", email: "test@test.com", username: "test" };

    mockRepo.create.mockReturnValue(user);
    mockRepo.save.mockResolvedValue(user);

    const result = await service.signup("test", "test@test.com", "pass");

    expect(result).toEqual(user);
    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockMail.sendVerificationEmail).toHaveBeenCalled();
  });

  it("signup throws if email exists", async () => {
    mockRepo.findOne.mockResolvedValueOnce({ id: "1" });

    await expect(
      service.signup("test", "test@test.com", "pass")
    ).rejects.toThrow();
  });

  it("signup throws if username exists", async () => {
    mockRepo.findOne.mockResolvedValueOnce(null);
    mockRepo.findOne.mockResolvedValueOnce({ id: "1" });

    await expect(
      service.signup("test", "test@test.com", "pass")
    ).rejects.toThrow();
  });

  it("validateUser returns user if password correct", async () => {
    const user = {
      id: "1",
      email: "test@test.com",
      password: await argon2.hash("pass"),
    };

    mockRepo.findOne.mockResolvedValue(user);

    const result = await service.validateUser("test@test.com", "pass");

    expect(result).toBeDefined();
  });

  it("validateUser returns null if password wrong", async () => {
    const user = {
      id: "1",
      email: "test@test.com",
      password: await argon2.hash("pass"),
    };

    mockRepo.findOne.mockResolvedValue(user);

    const result = await service.validateUser("test@test.com", "wrong");

    expect(result).toBeNull();
  });

  it("login returns tokens", async () => {
    const user: any = {
      id: "1",
      email: "test@test.com",
      role: "user",
    };

    mockRepo.save.mockResolvedValue(user);

    const result = await service.login(user);

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it("refreshTokens works", async () => {
    const refresh = "refreshToken";

    const user: any = {
      id: "1",
      email: "test@test.com",
      role: "user",
      hashedRefreshToken: await argon2.hash(refresh),
    };

    mockRepo.findOne.mockResolvedValue(user);
    mockRepo.save.mockResolvedValue(user);

    const result = await service.refreshTokens("1" as any, refresh);

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it("refreshTokens throws if token invalid", async () => {
    const user: any = {
      id: "1",
      email: "test@test.com",
      role: "user",
      hashedRefreshToken: await argon2.hash("real"),
    };

    mockRepo.findOne.mockResolvedValue(user);

    await expect(
      service.refreshTokens("1" as any, "fake")
    ).rejects.toThrow();
  });

  it("logout clears refresh token", async () => {
    const user: any = { id: "1", hashedRefreshToken: "abc" };

    mockRepo.findOne.mockResolvedValue(user);
    mockRepo.save.mockResolvedValue(user);

    await service.logout("1" as any);

    expect(user.hashedRefreshToken).toBeNull();
  });

  it("requestPasswordReset sends email", async () => {
    const user: any = { id: "1", email: "test@test.com" };

    mockRepo.findOne.mockResolvedValue(user);
    mockRepo.save.mockResolvedValue(user);

    const result = await service.requestPasswordReset("test@test.com");

    expect(result.message).toBe("Reset email sent");
    expect(mockMail.sendResetPassword).toHaveBeenCalled();
  });

  it("verifyEmail success", async () => {
    const token = "token";

    const user: any = {
      email: "test@test.com",
      emailVerified: false,
      emailVerificationToken: await argon2.hash(token),
      emailVerificationExpires: new Date(Date.now() + 10000),
    };

    mockRepo.findOne.mockResolvedValue(user);
    mockRepo.save.mockResolvedValue(user);

    const result = await service.verifyEmail("test@test.com", token);

    expect(result.message).toBe("Email successfully verified");
    expect(user.emailVerified).toBe(true);
  });

  it("resetPassword success", async () => {
    const token = "token";

    const user: any = {
      email: "test@test.com",
      resetPasswordToken: await argon2.hash(token),
      resetPasswordExpires: new Date(Date.now() + 10000),
    };

    mockRepo.findOne.mockResolvedValue(user);
    mockRepo.save.mockResolvedValue(user);

    const result = await service.resetPassword(
      "test@test.com",
      token,
      "newpass"
    );

    expect(result.message).toBe("Password reset successful");
  });

  it("resetPassword throws if token invalid", async () => {
    const user: any = {
      email: "test@test.com",
      resetPasswordToken: await argon2.hash("real"),
      resetPasswordExpires: new Date(Date.now() + 10000),
    };

    mockRepo.findOne.mockResolvedValue(user);

    await expect(
      service.resetPassword("test@test.com", "fake", "newpass")
    ).rejects.toThrow();
  });
});