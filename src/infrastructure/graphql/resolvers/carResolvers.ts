import { PrismaCarRepository } from '../../database/PrismaCarRepository';
import { ListCarsUseCase } from '../../../application/car/use-cases/ListCarsUseCase';
import { GetCarByIdUseCase } from '../../../application/car/use-cases/GetCarByIdUseCase';
import { CreateCarUseCase } from '../../../application/car/use-cases/CreateCarUseCase';
import { UpdateCarUseCase } from '../../../application/car/use-cases/UpdateCarUseCase';
import { DeleteCarUseCase } from '../../../application/car/use-cases/DeleteCarUseCase';
import { GetAvailableCarsUseCase } from '../../../application/car/use-cases/GetAvailableCarsUseCase';
import { GetCarImagesUseCase } from '../../../application/car/use-cases/GetCarImagesUseCase';
import { AddCarImageUseCase } from '../../../application/car/use-cases/AddCarImageUseCase';
import { DeleteCarImageUseCase } from '../../../application/car/use-cases/DeleteCarImageUseCase';
import { SetPrimaryImageUseCase } from '../../../application/car/use-cases/SetPrimaryImageUseCase';
import { AuthenticationError, AuthorizationError } from '../../../domain/errors/AppError';
import { Context } from '../../../interface/graphql/Context';

const carRepo = new PrismaCarRepository();

export const carResolvers = {
  Query: {
    cars: async (_parent: unknown, _args: unknown, _ctx: Context) => {
      // Existing GraphQL schema returns all cars; we mimic that behavior:
      const listCars = new ListCarsUseCase(carRepo);
      const result = await listCars.execute(1, 1000);
      return result.data;
    },

    car: async (_parent: unknown, { id }: { id: number }, _ctx: Context) => {
      const getCar = new GetCarByIdUseCase(carRepo);
      return getCar.execute(id);
    },

    availableCars: async (
      _parent: unknown,
      { startDate, endDate }: { startDate: string; endDate: string },
      _ctx: Context,
    ) => {
      const useCase = new GetAvailableCarsUseCase();
      return useCase.execute(new Date(startDate), new Date(endDate));
    },

    carImages: async (_parent: unknown, { carId }: { carId: number }, _ctx: Context) => {
      const useCase = new GetCarImagesUseCase();
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

      const useCase = new CreateCarUseCase(carRepo);
      return useCase.execute(input);
    },

    updateCar: async (
      _parent: unknown,
      { id, input }: { id: number; input: any },
      ctx: Context,
    ) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }

      const useCase = new UpdateCarUseCase(carRepo);
      return useCase.execute(id, input);
    },

    deleteCar: async (_parent: unknown, { id }: { id: number }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }

      const useCase = new DeleteCarUseCase(carRepo);
      await useCase.execute(id);
      return 'Car deleted successfully';
    },

    addCarImage: async (
      _parent: unknown,
      { carId, imageUrl, isPrimary }: { carId: number; imageUrl: string; isPrimary?: boolean },
      ctx: Context,
    ) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }

      const useCase = new AddCarImageUseCase();
      return useCase.execute(carId, imageUrl, isPrimary ?? false);
    },

    deleteCarImage: async (
      _parent: unknown,
      { imageId }: { imageId: number },
      ctx: Context,
    ) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }

      const useCase = new DeleteCarImageUseCase();
      await useCase.execute(imageId);
      return 'Image deleted successfully';
    },

    setPrimaryImage: async (
      _parent: unknown,
      { imageId }: { imageId: number },
      ctx: Context,
    ) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }

      const useCase = new SetPrimaryImageUseCase();
      return useCase.execute(imageId);
    },
  },
};