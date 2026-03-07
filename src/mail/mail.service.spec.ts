import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;

  const sendMailMock = jest.fn();

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        SMTP_HOST: 'smtp.test.com',
        SMTP_PORT: '587',
        SMTP_USER: 'test@test.com',
        SMTP_PASS: 'password',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    (createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send reset password email', async () => {
    sendMailMock.mockResolvedValue(true);

    const email = 'user@test.com';
    const url = 'http://reset-link';

    await service.sendResetPassword(email, url);

    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'test@test.com',
      to: email,
      subject: 'Sponti - Password Reset',
      html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
    });
  });

  it('should send verification email', async () => {
    sendMailMock.mockResolvedValue(true);

    const email = 'user@test.com';
    const url = 'http://verify-link';

    await service.sendVerificationEmail(email, url);

    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'test@test.com',
      to: email,
      subject: 'Sponti - Verify Your Email',
      html: `<p>Thank you for registering on Sponti!</p>
      <p>Please verify your email by clicking below:</p>
      <p><a href="${url}">Verify Email</a></p>`,
    });
  });
});