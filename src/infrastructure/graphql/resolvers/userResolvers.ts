import { PrismaUserRepository } from '../../database/PrismaUserRepository';
import { GetUserByIdUseCase, GetAllUsersUseCase } from '../../../application/auth';
import { AuthenticationError, AuthorizationError } from '../../../core/errors';
import { Context } from '../../../interface/graphql/Context';

// Infrastructure dependencies (injected into use cases)
const userRepo = new PrismaUserRepository();

/**
 * User GraphQL resolvers
 * Delivery layer - only handles GraphQL concerns and delegates to use cases
 */
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

    user: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
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
