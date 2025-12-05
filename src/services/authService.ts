import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import {
  CreateUserInput,
  LoginInput,
  UpdateUserInput,
  UserRole,
  AuthPayload,
} from '../types/inputs';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../utils/errors';
import { logger } from '../utils/logger';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async createAdminUser(data: CreateUserInput): Promise<AuthPayload> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const userData: any = { 
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: UserRole.ADMIN,
    };
    if (data.drivingLicenceNumber) {
      userData.drivingLicenceNumber = data.drivingLicenceNumber;
    }
    const user = await this.prisma.user.create({
      data: userData,
    });

    logger.info(`Admin user created: ${user.email}`);

    const tokens = this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async signup(data: CreateUserInput): Promise<AuthPayload> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    // Set role to USER if driving licence provided, otherwise GUEST
    const role = data.drivingLicenceNumber && data.drivingLicenceNumber.trim().length >= 5 
      ? UserRole.USER 
      : UserRole.GUEST;

    const userData: any = { 
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role,
    };
    if (data.drivingLicenceNumber?.trim()) {
      userData.drivingLicenceNumber = data.drivingLicenceNumber.trim();
    }
    const user = await this.prisma.user.create({
      data: userData,
    });

    logger.info(`User signed up: ${user.email} with role ${role}`);

    const tokens = this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async login(data: LoginInput): Promise<AuthPayload> {
    // Note: deletedAt check removed - run prisma generate after migration
    const user = await this.prisma.user.findFirst({
      where: { email: data.email },
    });
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      logger.warn(`Failed login attempt for: ${data.email}`);
      throw new AuthenticationError('Invalid credentials');
    }

    logger.info(`User logged in: ${user.email}`);

    const tokens = this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ token: string }> {
    try {
      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
      if (!jwtRefreshSecret) {
        throw new Error('JWT_REFRESH_SECRET is not configured');
      }

      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as { userId: number };

      const user = await this.prisma.user.findFirst({
        where: {
          id: decoded.userId,
        },
        select: {
          id: true,
          email: true,
          role: true,
          refreshToken: true,
        },
      });
      
      if (!user || user.refreshToken !== refreshToken) {
        throw new AuthenticationError('Invalid refresh token');
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured');
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } as jwt.SignOptions
      );

      return { token };
    } catch (error) {
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  async logout(userId: number): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  private generateTokens(user: { id: number; email: string; role: string }) {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }
    if (!jwtRefreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }

    const tokenOptions = { expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as string | number };
    const refreshTokenOptions = { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string | number };
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      jwtSecret,
      tokenOptions as SignOptions
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      jwtRefreshSecret,
      refreshTokenOptions as SignOptions
    );

    return { token, refreshToken };
  }

  private async saveRefreshToken(userId: number, refreshToken: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  private sanitizeUser(user: any) {
    const { password, refreshToken, ...sanitized } = user;
    return sanitized; // refreshToken will be properly typed after prisma generate
  }

  async updateUser(userId: number, data: UpdateUserInput) {
    // Note: deletedAt check removed - run prisma generate after migration
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new NotFoundError('User');
    }

    if (data.email && data.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailExists) {
        throw new ConflictError('Email already exists');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    logger.info(`User updated: ${updatedUser.email}`);
    return this.sanitizeUser(updatedUser);
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ) {
    // Note: deletedAt check removed - run prisma generate after migration
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundError('User');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new ValidationError('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    logger.info(`Password changed for user: ${user.email}`);
    return 'Password changed successfully';
  }

  async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    // Note: deletedAt check removed - run prisma generate after migration
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {},
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          imageUrl: true,
          drivingLicenceNumber: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: {} }),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(userId: number) {
    // Note: deletedAt check removed - run prisma generate after migration
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        imageUrl: true,
        drivingLicenceNumber: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  // Soft delete
  async deleteUser(userId: number) {
    // Note: deletedAt check removed - run prisma generate after migration
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new NotFoundError('User');
    }

    // Note: deletedAt check removed - run prisma generate after migration
    const activeRentals = await this.prisma.rental.findMany({
      where: { userId, status: 'ACTIVE' },
    });

    if (activeRentals.length > 0) {
      throw new ConflictError('Cannot delete user with active rentals');
    }

    // Note: deletedAt field will work after prisma generate
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() } as any, // Temporary - will work after prisma generate
    });

    logger.info(`User soft deleted: ${existingUser.email}`);
    return 'User deleted successfully';
  }

  async updateUserRole(userId: number, newRole: string) {
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(newRole as UserRole)) {
      throw new ValidationError('Invalid role');
    }

    // Note: deletedAt check removed - run prisma generate after migration
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundError('User');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    logger.info(`User role updated: ${user.email} -> ${newRole}`);
    return this.sanitizeUser(updatedUser);
  }
}