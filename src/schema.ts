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
    images: [CarImage!]!  # Multiple images per car
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
  }

  input CreateUserInput {
    email: String!
    password: String!
    name: String!
    drivingLicenceNumber: String  # Optional during registration
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
    drivingLicenceNumber: String  # Required if not already in user profile
    additionalInfo: String  # Optional additional rental information
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
    role: String!  # Valid values: GUEST, USER, ADMIN
  }

  type UnavailableDateRange {
    startDate: String!
    endDate: String!
  }

  type Query {
    me: User
    cars: [Car!]!
    car(id: Int!): Car
    rentals: [Rental!]!
    rental(id: Int!): Rental
    users: [User!]!
    user(id: Int!): User
    availableCars(startDate: String!, endDate: String!): [Car!]!
    carUnavailableDates(carId: Int!): [UnavailableDateRange!]!
    userActiveRentals: [Rental!]!
    carRentalHistory(carId: Int!): [Rental!]!
    carImages(carId: Int!): [CarImage!]!  # Get all images for a car
  }

  type Mutation {
    # Authentication
    signup(input: CreateUserInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: String!
    refreshToken(refreshToken: String!): RefreshTokenPayload!
    
    # Admin Operations
    createAdmin(input: CreateUserInput!): AuthPayload!
    
    # Car Operations
    createCar(input: CreateCarInput!): Car!
    updateCar(id: Int!, input: UpdateCarInput!): Car!
    deleteCar(id: Int!): String!
    
    # Car Image Operations (Admin only)
    addCarImage(carId: Int!, imageUrl: String!, isPrimary: Boolean): CarImage!
    deleteCarImage(imageId: Int!): String!
    setPrimaryImage(imageId: Int!): CarImage!
    
    # Rental Operations
    createRental(input: CreateRentalInput!): Rental!
    cancelRental(id: Int!): Rental!
    completeRental(id: Int!): Rental!  # Admin only
    
    # User Operations
    updateUser(input: UpdateUserInput!): User!
    changePassword(input: ChangePasswordInput!): String!
    deleteUser(id: Int!): String!
    updateUserRole(id: Int!, input: UpdateRoleInput!): User!
  }
`;