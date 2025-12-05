import { CarService } from '../services/carService';
import { RentalService } from '../services/rentalService';
import { AuthService } from '../services/authService';
import { Context } from '../types/context';
import {
  carValidation,
  userValidation,
  loginValidation,
  rentalValidation,
  userUpdateValidation,
  passwordChangeValidation,
  carUpdateValidation,
  roleUpdateValidation,
  adminValidation,
} from '../validation/schemas';
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
} from '../utils/errors';
import { CreateRentalInput, RentalStatus } from '../types/inputs';

// Helper functions
const requireAuth = (user: Context['user']) => {
  if (!user) {
    throw new AuthenticationError();
  }
  return user;
};

const requireAdmin = (user: Context['user']) => {
  const authedUser = requireAuth(user);
  if (authedUser.role !== 'ADMIN') {
    throw new AuthorizationError('Admin access required');
  }
  return authedUser;
};

const validateInput = (schema: any, input: any) => {
  const { error, value } = schema.validate(input, { abortEarly: false });
  if (error) {
    throw new ValidationError(error.details.map((d: any) => d.message).join(', '));
  }
  return value;
};

export const graphqlResolvers = {
  Query: {
    me: async (_: any, __: any, { user, prisma }: Context) => {
      const authedUser = requireAuth(user);
      const foundUser = await prisma.user.findFirst({
        where: { id: authedUser.id },
        select: { id: true, email: true, name: true, role: true, imageUrl: true, drivingLicenceNumber: true }
      });
      if (!foundUser) {
        throw new AuthenticationError('User not found');
      }
      return foundUser;
    },
    cars: async (_: any, __: any, { prisma }: Context) => {
      const carService = new CarService(prisma);
      // Return all cars without pagination for GraphQL query
      const result = await carService.getAllCars(1, 1000); // Large limit to get all cars
      return result.data; // Return just the cars array
    },
    car: (_: any, { id }: { id: number }, { prisma }: Context) => {
      const carService = new CarService(prisma);
      return carService.getCarById(id);
    },
    rentals: (_: any, __: any, { user, prisma }: Context) => {
      const authedUser = requireAuth(user);
      const rentalService = new RentalService(prisma);
      return rentalService.getUserRentals(authedUser.id);
    },
    users: (_: any, __: any, { user, prisma }: Context) => {
      requireAdmin(user);
      const authService = new AuthService(prisma);
      return authService.getAllUsers();
    },
    user: (_: any, { id }: { id: number }, { user, prisma }: Context) => {
      requireAdmin(user);
      const authService = new AuthService(prisma);
      return authService.getUserById(id);
    },
    availableCars: (_: any, { startDate, endDate }: { startDate: string, endDate: string }, { prisma }: Context) => {
      const carService = new CarService(prisma);
      return carService.getAvailableCars(new Date(startDate), new Date(endDate));
    },
    carUnavailableDates: (_: any, { carId }: { carId: number }, { prisma }: Context) => {
      const rentalService = new RentalService(prisma);
      return rentalService.getCarUnavailableDates(carId);
    },
    userActiveRentals: (_: any, __: any, { user, prisma }: Context) => {
      const authedUser = requireAuth(user);
      const rentalService = new RentalService(prisma);
      return rentalService.getUserActiveRentals(authedUser.id);
    },
    carRentalHistory: (_: any, { carId }: { carId: number }, { user, prisma }: Context) => {
      requireAdmin(user);
      const rentalService = new RentalService(prisma);
      return rentalService.getCarRentalHistory(carId);
    },
    carImages: (_: any, { carId }: { carId: number }, { prisma }: Context) => {
      const carService = new CarService(prisma);
      return carService.getCarImages(carId);
    },
  },
  Mutation: {
    signup: async (_: any, { input }: { input: any }, { prisma }: Context) => {
      const validatedInput = validateInput(userValidation, input);
      const authService = new AuthService(prisma);
      return authService.signup(validatedInput);
    },
    login: async (_: any, { input }: { input: any }, { prisma }: Context) => {
      const validatedInput = validateInput(loginValidation, input);
      const authService = new AuthService(prisma);
      return authService.login(validatedInput);
    },
    createAdmin: async (_: any, { input }: { input: any }, { user, prisma }: Context) => {
      requireAdmin(user);
      const validatedInput = validateInput(adminValidation, input);
      const authService = new AuthService(prisma);
      return authService.createAdminUser(validatedInput);
    },
    createCar: async (_: any, { input }: { input: any }, { user, prisma }: Context) => {
      requireAdmin(user);
      const validatedInput = validateInput(carValidation, input);
      
      // Normalize optional string fields - convert empty strings to null
      if (validatedInput.imageUrl === '') validatedInput.imageUrl = null;
      if (validatedInput.fuelType === '') validatedInput.fuelType = null;
      if (validatedInput.transmission === '') validatedInput.transmission = null;
      if (validatedInput.engine === '') validatedInput.engine = null;
      if (validatedInput.description === '') validatedInput.description = null;
      
      const carService = new CarService(prisma);
      return carService.createCar(validatedInput);
    },
    createRental: async (_: any, { input }: { input: CreateRentalInput }, { user, prisma }: Context) => {
      const authedUser = requireAuth(user);
      const validatedInput = validateInput(rentalValidation, input);
      
      const rentalService = new RentalService(prisma);
      return rentalService.createRental(
        {
          ...validatedInput,
          startDate: new Date(validatedInput.startDate),
          endDate: new Date(validatedInput.endDate),
          userId: authedUser.id
        },
        validatedInput.drivingLicenceNumber,
        validatedInput.additionalInfo
      );
    },
    cancelRental: async (_: any, { id }: { id: number }, { user, prisma }: Context) => {
      const authedUser = requireAuth(user);
      const rentalService = new RentalService(prisma);
      return rentalService.cancelRental(id, authedUser.id, authedUser.role);
    },
    logout: async (_: any, __: any, { user, prisma }: Context) => {
      const authedUser = requireAuth(user);
      const authService = new AuthService(prisma);
      await authService.logout(authedUser.id);
      return 'Logged out successfully';
    },
    refreshToken: async (_: any, { refreshToken }: { refreshToken: string }, { prisma }: Context) => {
      const authService = new AuthService(prisma);
      return authService.refreshAccessToken(refreshToken);
    },
    completeRental: async (_: any, { id }: { id: number }, { user, prisma }: Context) => {
      requireAdmin(user);
      const rentalService = new RentalService(prisma);
      return rentalService.completeRental(id);
    },
    updateCar: async (_: any, { id, input }: { id: number, input: any }, { user, prisma }: Context) => {
      requireAdmin(user);
      const validatedInput = validateInput(carUpdateValidation, input);
      
      // Normalize optional string fields - convert empty strings to null
      if (validatedInput.imageUrl === '') validatedInput.imageUrl = null;
      if (validatedInput.fuelType === '') validatedInput.fuelType = null;
      if (validatedInput.transmission === '') validatedInput.transmission = null;
      if (validatedInput.engine === '') validatedInput.engine = null;
      if (validatedInput.description === '') validatedInput.description = null;
      
      const carService = new CarService(prisma);
      return carService.updateCar(id, validatedInput);
    },
    deleteCar: async (_: any, { id }: { id: number }, { user, prisma }: Context) => {
      requireAdmin(user);
      const carService = new CarService(prisma);
      await carService.deleteCar(id);
      return 'Car deleted successfully';
    },
    updateUser: async (_: any, { input }: { input: any }, { user, prisma }: Context) => {
      const authedUser = requireAuth(user);
      const validatedInput = validateInput(userUpdateValidation, input);
      const authService = new AuthService(prisma);
      return authService.updateUser(authedUser.id, validatedInput);
    },
    changePassword: async (_: any, { input }: { input: any }, { user, prisma }: Context) => {
      const authedUser = requireAuth(user);
      const validatedInput = validateInput(passwordChangeValidation, input);
      const authService = new AuthService(prisma);
      return authService.changePassword(authedUser.id, validatedInput.currentPassword, validatedInput.newPassword);
    },
    deleteUser: async (_: any, { id }: { id: number }, { user, prisma }: Context) => {
      requireAdmin(user);
      const authService = new AuthService(prisma);
      return authService.deleteUser(id);
    },
    updateUserRole: async (_: any, { id, input }: { id: number, input: any }, { user, prisma }: Context) => {
      requireAdmin(user);
      const validatedInput = validateInput(roleUpdateValidation, input);
      const authService = new AuthService(prisma);
      return authService.updateUserRole(id, validatedInput.role);
    },
    // Car Image Operations
    addCarImage: async (_: any, { carId, imageUrl, isPrimary }: { carId: number, imageUrl: string, isPrimary?: boolean }, { user, prisma }: Context) => {
      requireAdmin(user);
      const carService = new CarService(prisma);
      return carService.addCarImage(carId, imageUrl, isPrimary || false);
    },
    deleteCarImage: async (_: any, { imageId }: { imageId: number }, { user, prisma }: Context) => {
      requireAdmin(user);
      const carService = new CarService(prisma);
      await carService.deleteCarImage(imageId);
      return 'Image deleted successfully';
    },
    setPrimaryImage: async (_: any, { imageId }: { imageId: number }, { user, prisma }: Context) => {
      requireAdmin(user);
      const carService = new CarService(prisma);
      return carService.setPrimaryImage(imageId);
    },
  },
};