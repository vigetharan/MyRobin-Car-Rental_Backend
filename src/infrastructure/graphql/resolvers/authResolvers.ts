import { PrismaUserRepository } from '../../database/PrismaUserRepository';
import { JwtTokenService } from '../../security/JwtTokenService';
import { BcryptPasswordHasher } from '../../security/BcryptPasswordHasher';
import { logger } from '../../logging/logger';
import {
  SignupUseCase,
  LoginUseCase,
  LogoutUseCase,
  RefreshTokenUseCase,
  CreateAdminUseCase,
  UpdateUserUseCase,
  ChangePasswordUseCase,
  DeleteUserUseCase,
  UpdateUserRoleUseCase,
} from '../../../application/auth';
import { userValidation, loginValidation, adminValidation, userUpdateValidation, passwordChangeValidation, roleUpdateValidation } from '../../../validation/schemas';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../core/errors';
import { Context } from '../../../interface/graphql/Context';

// Infrastructure dependencies (injected into use cases)
const userRepo = new PrismaUserRepository();
const tokenService = new JwtTokenService();
const passwordHasher = new BcryptPasswordHasher();

const validateInput = (schema: any, input: any) => {
  const { error, value } = schema.validate(input, { abortEarly: false });
  if (error) {
    throw new ValidationError(error.details.map((d: any) => d.message).join(', '));
  }
  return value;
};

/**
 * Auth GraphQL resolvers
 * Delivery layer - only handles GraphQL concerns and delegates to use cases
 */
export const authResolvers = {
  Mutation: {
    signup: async (_parent: unknown, { input }: { input: any }, _ctx: Context) => {
      const validatedInput = validateInput(userValidation, input);
      const useCase = new SignupUseCase(userRepo, tokenService, passwordHasher, logger);
      return useCase.execute(validatedInput);
    },

    login: async (_parent: unknown, { input }: { input: any }, _ctx: Context) => {
      const validatedInput = validateInput(loginValidation, input);
      const useCase = new LoginUseCase(userRepo, tokenService, passwordHasher, logger);
      return useCase.execute(validatedInput);
    },

    logout: async (_parent: unknown, _args: unknown, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      const useCase = new LogoutUseCase(userRepo, logger);
      await useCase.execute(ctx.user.id);
      return 'Logged out successfully';
    },

    refreshToken: async (_parent: unknown, { refreshToken }: { refreshToken: string }, _ctx: Context) => {
      const useCase = new RefreshTokenUseCase(userRepo, tokenService, logger);
      return useCase.execute(refreshToken);
    },

    createAdmin: async (_parent: unknown, { input }: { input: any }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }
      const validatedInput = validateInput(adminValidation, input);
      const useCase = new CreateAdminUseCase(userRepo, tokenService, passwordHasher, logger);
      return useCase.execute(validatedInput);
    },

    updateUser: async (_parent: unknown, { input }: { input: any }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      const validatedInput = validateInput(userUpdateValidation, input);
      const useCase = new UpdateUserUseCase(userRepo, logger);
      return useCase.execute(ctx.user.id, validatedInput);
    },

    changePassword: async (_parent: unknown, { input }: { input: any }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      const validatedInput = validateInput(passwordChangeValidation, input);
      const useCase = new ChangePasswordUseCase(userRepo, passwordHasher, logger);
      return useCase.execute(ctx.user.id, validatedInput.currentPassword, validatedInput.newPassword);
    },

    deleteUser: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }
      const useCase = new DeleteUserUseCase(userRepo, logger);
      return useCase.execute(id);
    },

    updateUserRole: async (_parent: unknown, { id, input }: { id: string; input: any }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }
      const validatedInput = validateInput(roleUpdateValidation, input);
      const useCase = new UpdateUserRoleUseCase(userRepo, logger);
      return useCase.execute(id, validatedInput.role);
    },
  },
};
