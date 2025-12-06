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
    carId: ID!
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
    carId: ID!
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
    car(id: ID!): Car
    rentals: [Rental!]!
    rental(id: ID!): Rental
    allRentals: [Rental!]!
    users: [User!]!
    user(id: ID!): User
    availableCars(startDate: String!, endDate: String!): [Car!]!
    carUnavailableDates(carId: ID!): [UnavailableDateRange!]!
    userActiveRentals: [Rental!]!
    carRentalHistory(carId: ID!): [Rental!]!
    carImages(carId: ID!): [CarImage!]!
    rentalStats: RentalStats!
  }

  type Mutation {
    signup(input: CreateUserInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: String!
    refreshToken(refreshToken: String!): RefreshTokenPayload!
    createAdmin(input: CreateUserInput!): AuthPayload!
    createCar(input: CreateCarInput!): Car!
    updateCar(id: ID!, input: UpdateCarInput!): Car!
    deleteCar(id: ID!): String!
    addCarImage(carId: ID!, imageUrl: String!, isPrimary: Boolean): CarImage!
    deleteCarImage(imageId: ID!): String!
    setPrimaryImage(imageId: ID!): CarImage!
    createRental(input: CreateRentalInput!): Rental!
    cancelRental(id: ID!): Rental!
    completeRental(id: ID!): Rental!
    updateRental(id: ID!, input: UpdateRentalInput!): Rental!
    extendRental(id: ID!, input: ExtendRentalInput!): Rental!
    deleteRental(id: ID!): String!
    updateUser(input: UpdateUserInput!): User!
    changePassword(input: ChangePasswordInput!): String!
    deleteUser(id: ID!): String!
    updateUserRole(id: ID!, input: UpdateRoleInput!): User!
  }
`;
