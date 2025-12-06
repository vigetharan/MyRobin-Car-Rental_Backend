import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    name: String!
    role: String!
    imageUrl: String
    drivingLicenceNumber: String
    createdAt: String!
    updatedAt: String!
  }

  type Car {
    id: ID!
    make: String!
    model: String!
    year: Int!
    color: String!
    pricePerDay: Float!
    available: Boolean!
    imageUrl: String
    fuelType: String
    transmission: String
    seats: Int
    engine: String
    mileage: Int
    description: String
    images: [CarImage!]!
    createdAt: String!
    updatedAt: String!
  }

  type CarImage {
    id: ID!
    carId: Int!
    imageUrl: String!
    isPrimary: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Rental {
    id: ID!
    startDate: String!
    endDate: String!
    totalPrice: Float!
    status: String!
    user: User!
    car: Car!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    refreshToken: String
    user: User!
  }

  type RefreshTokenPayload {
    token: String!
    refreshToken: String
  }

  input CreateUserInput {
    email: String!
    password: String!
    name: String!
    drivingLicenceNumber: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateCarInput {
    make: String!
    model: String!
    year: Int!
    color: String!
    pricePerDay: Float!
    imageUrl: String
    fuelType: String
    transmission: String
    seats: Int
    engine: String
    mileage: Int
    description: String
  }

  input CreateRentalInput {
    carId: Int!
    startDate: String!
    endDate: String!
    drivingLicenceNumber: String
    additionalInfo: String
  }

  input UpdateUserInput {
    email: String
    name: String
    imageUrl: String
    drivingLicenceNumber: String
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  input UpdateCarInput {
    make: String
    model: String
    year: Int
    color: String
    pricePerDay: Float
    imageUrl: String
    available: Boolean
    fuelType: String
    transmission: String
    seats: Int
    engine: String
    mileage: Int
    description: String
  }

  input UpdateRoleInput {
    role: String!
  }

  input UpdateRentalInput {
    startDate: String
    endDate: String
  }

  input ExtendRentalInput {
    newEndDate: String!
  }

  type UnavailableDateRange {
    startDate: String!
    endDate: String!
  }

  type RentalStats {
    totalRentals: Int!
    activeRentals: Int!
    completedRentals: Int!
    cancelledRentals: Int!
    pendingRentals: Int!
    totalRevenue: Float!
  }

  type Query {
    me: User
    cars: [Car!]!
    car(id: Int!): Car
    rentals: [Rental!]!
    rental(id: Int!): Rental
    allRentals: [Rental!]!
    users: [User!]!
    user(id: Int!): User
    availableCars(startDate: String!, endDate: String!): [Car!]!
    carUnavailableDates(carId: Int!): [UnavailableDateRange!]!
    userActiveRentals: [Rental!]!
    carRentalHistory(carId: Int!): [Rental!]!
    carImages(carId: Int!): [CarImage!]!
    rentalStats: RentalStats!
  }

  type Mutation {
    signup(input: CreateUserInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: String!
    refreshToken(refreshToken: String!): RefreshTokenPayload!
    createAdmin(input: CreateUserInput!): AuthPayload!
    createCar(input: CreateCarInput!): Car!
    updateCar(id: Int!, input: UpdateCarInput!): Car!
    deleteCar(id: Int!): String!
    addCarImage(carId: Int!, imageUrl: String!, isPrimary: Boolean): CarImage!
    deleteCarImage(imageId: Int!): String!
    setPrimaryImage(imageId: Int!): CarImage!
    createRental(input: CreateRentalInput!): Rental!
    cancelRental(id: Int!): Rental!
    completeRental(id: Int!): Rental!
    updateRental(id: Int!, input: UpdateRentalInput!): Rental!
    extendRental(id: Int!, input: ExtendRentalInput!): Rental!
    deleteRental(id: Int!): String!
    updateUser(input: UpdateUserInput!): User!
    changePassword(input: ChangePasswordInput!): String!
    deleteUser(id: Int!): String!
    updateUserRole(id: Int!, input: UpdateRoleInput!): User!
  }
`;
