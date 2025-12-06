import { PrismaRentalRepository } from '../../database/PrismaRentalRepository';
import { PrismaUserRepository } from '../../database/PrismaUserRepository';
import { PrismaCarRepository } from '../../database/PrismaCarRepository';
import { CreateRentalUseCase } from '../../../application/rental/use-cases/CreateRentalUseCase';
import { CancelRentalUseCase } from '../../../application/rental/use-cases/CancelRentalUseCase';
import { CompleteRentalUseCase } from '../../../application/rental/use-cases/CompleteRentalUseCase';
import { GetUserRentalsUseCase } from '../../../application/rental/use-cases/GetUserRentalsUseCase';
import { GetUserActiveRentalsUseCase } from '../../../application/rental/use-cases/GetUserActiveRentalsUseCase';
import { GetCarRentalHistoryUseCase } from '../../../application/rental/use-cases/GetCarRentalHistoryUseCase';
import { GetCarUnavailableDatesUseCase } from '../../../application/rental/use-cases/GetCarUnavailableDatesUseCase';
import { AuthenticationError, AuthorizationError } from '../../../domain/errors/AppError';
import { Context } from '../../../interface/graphql/Context';

const rentalRepo = new PrismaRentalRepository();
const userRepo = new PrismaUserRepository();
const carRepo = new PrismaCarRepository();

export const rentalResolvers = {
  Query: {
    rentals: async (_parent: unknown, _args: unknown, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      const useCase = new GetUserRentalsUseCase(rentalRepo);
      return useCase.execute(ctx.user.id);
    },

    userActiveRentals: async (_parent: unknown, _args: unknown, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      const useCase = new GetUserActiveRentalsUseCase(rentalRepo);
      return useCase.execute(ctx.user.id);
    },

    carUnavailableDates: async (_parent: unknown, { carId }: { carId: number }, _ctx: Context) => {
      const useCase = new GetCarUnavailableDatesUseCase(rentalRepo);
      return useCase.execute(carId);
    },

    carRentalHistory: async (_parent: unknown, { carId }: { carId: number }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }
      const useCase = new GetCarRentalHistoryUseCase(rentalRepo);
      return useCase.execute(carId);
    },
  },

  Mutation: {
    createRental: async (_parent: unknown, { input }: { input: any }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      const useCase = new CreateRentalUseCase(rentalRepo, userRepo, carRepo);
      return useCase.execute(ctx.user.id, {
        carId: input.carId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        drivingLicenceNumber: input.drivingLicenceNumber,
        additionalInfo: input.additionalInfo,
      });
    },

    cancelRental: async (_parent: unknown, { id }: { id: number }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      const useCase = new CancelRentalUseCase(rentalRepo);
      return useCase.execute(id, ctx.user.id, ctx.user.role);
    },

    completeRental: async (_parent: unknown, { id }: { id: number }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }
      const useCase = new CompleteRentalUseCase(rentalRepo);
      return useCase.execute(id);
    },
  },
};
