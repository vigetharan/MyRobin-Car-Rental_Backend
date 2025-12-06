import { PrismaRentalRepository } from '../../database/PrismaRentalRepository';
import { PrismaUserRepository } from '../../database/PrismaUserRepository';
import { PrismaCarRepository } from '../../database/PrismaCarRepository';
import { logger } from '../../logging/logger';
import {
  CreateRentalUseCase,
  CancelRentalUseCase,
  CompleteRentalUseCase,
  DeleteRentalUseCase,
  ExtendRentalUseCase,
  UpdateRentalUseCase,
  GetRentalByIdUseCase,
  GetUserRentalsUseCase,
  GetAllRentalsUseCase,
  GetUserActiveRentalsUseCase,
  GetCarRentalHistoryUseCase,
  GetCarUnavailableDatesUseCase,
  GetRentalStatsUseCase,
} from '../../../application/rental';
import { AuthenticationError, AuthorizationError } from '../../../core/errors';
import { Context } from '../../../interface/graphql/Context';

// Infrastructure dependencies (injected into use cases)
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

    carUnavailableDates: async (_parent: unknown, { carId }: { carId: string }, _ctx: Context) => {
      const useCase = new GetCarUnavailableDatesUseCase(rentalRepo);
      return useCase.execute(carId);
    },

    carRentalHistory: async (_parent: unknown, { carId }: { carId: string }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }
      const useCase = new GetCarRentalHistoryUseCase(rentalRepo);
      return useCase.execute(carId);
    },

    // Get single rental by ID
    rental: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      const useCase = new GetRentalByIdUseCase(rentalRepo);
      const rental = await useCase.execute(id);
      
      // Users can only view their own rentals, admins can view all
      if (rental.userId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Not authorized to view this rental');
      }
      return rental;
    },

    // Admin: Get all rentals across all users
    allRentals: async (_parent: unknown, _args: unknown, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }
      const useCase = new GetAllRentalsUseCase(rentalRepo);
      return useCase.execute();
    },

    // Admin: Get rental statistics for dashboard
    rentalStats: async (_parent: unknown, _args: unknown, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }
      const useCase = new GetRentalStatsUseCase(rentalRepo);
      return useCase.execute();
    },
  },

  Mutation: {
    createRental: async (_parent: unknown, { input }: { input: any }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      const useCase = new CreateRentalUseCase(rentalRepo, userRepo, carRepo, logger);
      return useCase.execute(ctx.user.id, {
        carId: input.carId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        drivingLicenceNumber: input.drivingLicenceNumber,
        additionalInfo: input.additionalInfo,
      });
    },

    cancelRental: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      const useCase = new CancelRentalUseCase(rentalRepo, logger);
      return useCase.execute(id, ctx.user.id, ctx.user.role);
    },

    completeRental: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }
      const useCase = new CompleteRentalUseCase(rentalRepo, logger);
      return useCase.execute(id);
    },

    // Admin: Update rental dates
    updateRental: async (_parent: unknown, { id, input }: { id: string; input: any }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }
      
      // Get the rental to find car price
      const rentalUseCase = new GetRentalByIdUseCase(rentalRepo);
      const rental = await rentalUseCase.execute(id);
      
      // Get car to find price per day
      const car = await carRepo.findById(rental.carId);
      if (!car) {
        throw new Error('Car not found');
      }
      
      const useCase = new UpdateRentalUseCase(rentalRepo, logger);
      return useCase.execute(id, {
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      }, car.pricePerDay);
    },

    // Extend rental end date
    extendRental: async (_parent: unknown, { id, input }: { id: string; input: any }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      
      // Get the rental to check ownership and get car price
      const rentalUseCase = new GetRentalByIdUseCase(rentalRepo);
      const rental = await rentalUseCase.execute(id);
      
      // Users can extend their own rentals, admins can extend any
      if (rental.userId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Not authorized to extend this rental');
      }
      
      // Get car to find price per day
      const car = await carRepo.findById(rental.carId);
      if (!car) {
        throw new Error('Car not found');
      }
      
      const useCase = new ExtendRentalUseCase(rentalRepo, logger);
      return useCase.execute(id, new Date(input.newEndDate), car.pricePerDay);
    },

    // Admin: Delete rental
    deleteRental: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
      if (!ctx.user) {
        throw new AuthenticationError();
      }
      if (ctx.user.role !== 'ADMIN') {
        throw new AuthorizationError('Admin access required');
      }
      const useCase = new DeleteRentalUseCase(rentalRepo, logger);
      await useCase.execute(id);
      return 'Rental deleted successfully';
    },
  },
  Rental: {
    user: (parent: any) => parent.user,
    car: (parent: any) => parent.car,
    startDate: (parent: any) => {
      if (parent.startDate instanceof Date) {
        return parent.startDate.toISOString();
      }
      // If it's already a string or number, convert it
      return new Date(parent.startDate).toISOString();
    },
    endDate: (parent: any) => {
      if (parent.endDate instanceof Date) {
        return parent.endDate.toISOString();
      }
      return new Date(parent.endDate).toISOString();
    },
    createdAt: (parent: any) => {
      if (parent.createdAt instanceof Date) {
        return parent.createdAt.toISOString();
      }
      return new Date(parent.createdAt).toISOString();
    },
    updatedAt: (parent: any) => {
      if (parent.updatedAt instanceof Date) {
        return parent.updatedAt.toISOString();
      }
      return new Date(parent.updatedAt).toISOString();
    },
  },
};
