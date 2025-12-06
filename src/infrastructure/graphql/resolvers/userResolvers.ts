import { PrismaUserRepository } from '../../database/PrismaUserRepository';
import { GetUserByIdUseCase } from '../../../application/auth/use-cases/GetUserByIdUseCase';
import { GetAllUsersUseCase } from '../../../application/auth/use-cases/GetAllUsersUseCase';
import { AuthenticationError, AuthorizationError } from '../../../domain/errors/AppError';
import { Context } from '../../../interface/graphql/Context';

const userRepo = new PrismaUserRepository();

export const userResolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      const useCase = new GetUserByIdUseCase(userRepo);
      return useCase.execute(ctx.user.id);
    },

    users: async (_parent: unknown, _args: unknown, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }
      const useCase = new GetAllUsersUseCase(userRepo);
      return useCase.execute();
    },

    user: async (_parent: unknown, { id }: { id: number }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }
      const useCase = new GetUserByIdUseCase(userRepo);
      return useCase.execute(id);
    },
  },
};
