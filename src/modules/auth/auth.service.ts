import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}
  async register(dto: RegisterDto) {
    // Verify if exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    // hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // create account + user + policy atomically. New tenant is born here
    const result = await this.prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          name: dto.accountName,
          timezone: dto.timezone ?? 'UTC',
        },
      });
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          accountId: account.id,
        },
      });
      await tx.policy.create({
        data: {
          accountId: account.id,
          minNoticeHours: 2,
          cancelLimitHours: 24,
          slotDurationMin: 30,
        },
      });
      return { account, user };
    });
    const {
      user: { id, email, accountId },
      account: { name, timezone },
    } = result;
    return {
      user: { id, email, accountId },
      account: { name, timezone },
      token: this.signToken(
        result.user.id,
        result.account.id,
        result.user.email,
      ),
    };
  }

  async login(dto: LoginDto) {
    const userFound = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!userFound) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, userFound.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return {
      token: this.signToken(userFound.id, userFound.accountId, userFound.email),
    };
  }
  private signToken(userId: string, accountId: string, email: string): string {
    return this.jwt.sign({ sub: userId, accountId, email });
  }
}
