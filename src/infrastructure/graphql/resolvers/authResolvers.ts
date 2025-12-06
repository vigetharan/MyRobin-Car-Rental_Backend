import { PrismaUserRepository } from '../../database/PrismaUserRepository';
import { SignupUseCase } from '../../../application/auth/use-cases/SignupUseCase';
import { LoginUseCase } from '../../../application/auth/use-cases/LoginUseCase';
import { LogoutUseCase } from '../../../application/auth/use-cases/LogoutUseCase';
import { RefreshTokenUseCase } from '../../../application/auth/use-cases/RefreshTokenUseCase';
import { CreateAdminUseCase } from '../../../application/auth/use-cases/CreateAdminUseCase';
import { UpdateUserUseCase } from '../../../application/auth/use-cases/UpdateUserUseCase';
import { ChangePasswordUseCase } from '../../../application/auth/use-cases/ChangePasswordUseCase';
import { DeleteUserUseCase } from '../../../application/auth/use-cases/DeleteUserUseCase';
import { UpdateUserRoleUseCase } from '../../../application/auth/use-cases/UpdateUserRoleUseCase';
import { userValidation, loginValidation, adminValidation, userUpdateValidation, passwordChangeValidation, roleUpdateValidation } from '../../../validation/schemas';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../domain/errors/AppError';
import { Context } from '../../../interface/graphql/Context';

const userRepo = new PrismaUserRepository();

const validateInput = (schema: any, input: any) => {
  const { error, value } = schema.validate(input, { abortEarly: false });
  if (error) {
    throw new ValidationError(error.details.map((d: any) => d.message).join(', '));
  }
  return value;
};

export const authResolvers = {
  Mutation: {
    signup: async (_parent: unknown, { input }: { input: any }, _ctx: Context) => {
      const validatedInput = validateInput(userValidation, input);
      const useCase = new SignupUseCase(userRepo);
      return useCase.execute(validatedInput);
    },

    login: async (_parent: unknown, { input }: { input: any }, _ctx: Context) => {
      const validatedInput = validateInput(loginValidation, input);
      const useCase = new LoginUseCase(userRepo);
      return useCase.execute(validatedInput);
    },

    logout: async (_parent: unknown, _args: unknown, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      const useCase = new LogoutUseCase(userRepo);
      await useCase.execute(ctx.user.id);
      return 'Logged out successfully';
    },

    refreshToken: async (_parent: unknown, { refreshToken }: { refreshToken: string }, _ctx: Context) => {
      const useCase = new RefreshTokenUseCase(userRepo);
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
      const useCase = new CreateAdminUseCase(userRepo);
      return useCase.execute(validatedInput);
    },

    updateUser: async (_parent: unknown, { input }: { input: any }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      const validatedInput = validateInput(userUpdateValidation, input);
      const useCase = new UpdateUserUseCase(userRepo);
      return useCase.execute(ctx.user.id, validatedInput);
    },

    changePassword: async (_parent: unknown, { input }: { input: any }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      const validatedInput = validateInput(passwordChangeValidation, input);
      const useCase = new ChangePasswordUseCase(userRepo);
      return useCase.execute(ctx.user.id, validatedInput.currentPassword, validatedInput.newPassword);
    },

    deleteUser: async (_parent: unknown, { id }: { id: number }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }
      const useCase = new DeleteUserUseCase(userRepo);
      return useCase.execute(id);
    },

    updateUserRole: async (_parent: unknown, { id, input }: { id: number; input: any }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }
      const validatedInput = validateInput(roleUpdateValidation, input);
      const useCase = new UpdateUserRoleUseCase(userRepo);
      return useCase.execute(id, validatedInput.role);
    },
  },
};
