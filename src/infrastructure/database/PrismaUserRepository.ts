import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prismaClient';
import { User } from '../../domain/user/User';
import { UserRepository, CreateUserData, UpdateUserData } from '../../application/auth/ports/UserRepository';

export class PrismaUserRepository implements UserRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? getPrismaClient();
  }

  async create(data: CreateUserData): Promise<User> {
    const user = await this.prisma.user.create({ data });
    return user as unknown as User;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    return user as unknown as User | null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user as unknown as User | null;
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return users as unknown as User[];
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    return user as unknown as User;
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async updateRole(id: string, role: string): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { role },
    });
    return user as unknown as User;
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { refreshToken },
    });
  }

  async updateDrivingLicence(id: string, drivingLicenceNumber: string, role?: string): Promise<void> {
    const data: any = { drivingLicenceNumber };
    if (role) {
      data.role = role;
    }
    await this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
