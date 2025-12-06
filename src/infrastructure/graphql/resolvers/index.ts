import { carResolvers } from './carResolvers';
import { rentalResolvers } from './rentalResolvers';
import { authResolvers } from './authResolvers';
import { userResolvers } from './userResolvers';

export const resolvers = {
  Query: {
    ...carResolvers.Query,
    ...rentalResolvers.Query,
    ...userResolvers.Query,
  },
  Mutation: {
    ...carResolvers.Mutation,
    ...rentalResolvers.Mutation,
    ...authResolvers.Mutation,
  },
  Rental: rentalResolvers.Rental,
};
