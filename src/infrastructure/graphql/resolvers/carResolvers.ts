import { PrismaCarRepository } from '../../database/PrismaCarRepository';
import { PrismaCarImageRepository } from '../../database/PrismaCarImageRepository';
import { logger } from '../../logging/logger';
import {
  ListCarsUseCase,
  GetCarByIdUseCase,
  CreateCarUseCase,
  UpdateCarUseCase,
  DeleteCarUseCase,
  GetAvailableCarsUseCase,
  GetCarImagesUseCase,
  AddCarImageUseCase,
  DeleteCarImageUseCase,
  SetPrimaryImageUseCase,
} from '../../../application/car';
import { AuthenticationError, AuthorizationError } from '../../../core/errors';
import { Context } from '../../../interface/graphql/Context';

// Infrastructure dependencies (injected into use cases)
const carRepo = new PrismaCarRepository();
const carImageRepo = new PrismaCarImageRepository();

/**
 * Car GraphQL resolvers
 * Delivery layer - only handles GraphQL concerns and delegates to use cases
 */
export const carResolvers = {
  Query: {
    cars: async (_parent: unknown, _args: unknown, _ctx: Context) => {
      const useCase = new ListCarsUseCase(carRepo);
      const result = await useCase.execute(1, 1000);
      return result.data;
    },

    car: async (_parent: unknown, { id }: { id: string }, _ctx: Context) => {
      const useCase = new GetCarByIdUseCase(carRepo);
      return useCase.execute(id);
    },

    availableCars: async (
      _parent: unknown,
      { startDate, endDate }: { startDate: string; endDate: string },
      _ctx: Context,
    ) => {
      const useCase = new GetAvailableCarsUseCase(carRepo);
      return useCase.execute(new Date(startDate), new Date(endDate));
    },

    carImages: async (_parent: unknown, { carId }: { carId: string }, _ctx: Context) => {
      const useCase = new GetCarImagesUseCase(carRepo, carImageRepo);
      return useCase.execute(carId);
    },
  },

  Mutation: {
    createCar: async (_parent: unknown, { input }: { input: any }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }

      const useCase = new CreateCarUseCase(carRepo, logger);
      return useCase.execute(input);
    },

    updateCar: async (
      _parent: unknown,
      { id, input }: { id: string; input: any },
      ctx: Context,
    ) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }

      const useCase = new UpdateCarUseCase(carRepo, logger);
      return useCase.execute(id, input);
    },

    deleteCar: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }

      const useCase = new DeleteCarUseCase(carRepo, logger);
      await useCase.execute(id);
      return 'Car deleted successfully';
    },

    addCarImage: async (
      _parent: unknown,
      { carId, imageUrl, isPrimary }: { carId: string; imageUrl: string; isPrimary?: boolean },
      ctx: Context,
    ) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }

      const useCase = new AddCarImageUseCase(carRepo, carImageRepo, logger);
      return useCase.execute(carId, imageUrl, isPrimary ?? false);
    },

    deleteCarImage: async (
      _parent: unknown,
      { imageId }: { imageId: string },
      ctx: Context,
    ) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }

      const useCase = new DeleteCarImageUseCase(carImageRepo, logger);
      await useCase.execute(imageId);
      return 'Image deleted successfully';
    },

    setPrimaryImage: async (
      _parent: unknown,
      { imageId }: { imageId: string },
      ctx: Context,
    ) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }

      const useCase = new SetPrimaryImageUseCase(carImageRepo, logger);
      return useCase.execute(imageId);
    },
  },
};