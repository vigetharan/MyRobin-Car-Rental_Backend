import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Rental status constants
const RentalStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

const cars = [
  {
    make: 'Toyota',
    model: 'Camry',
    year: 2024,
    color: 'White',
    pricePerDay: 55.0,
    fuelType: 'Hybrid',
    transmission: 'Automatic',
    seats: 5,
    engine: '2.5L 4-Cylinder',
    mileage: 1500,
    description: 'Reliable and fuel-efficient sedan, perfect for city driving and road trips.',
    imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3968e398?q=80&w=2670&auto=format&fit=crop',
  },
  {
    make: 'Tesla',
    model: 'Model 3',
    year: 2023,
    color: 'Red',
    pricePerDay: 120.0,
    fuelType: 'Electric',
    transmission: 'Automatic',
    seats: 5,
    engine: 'Dual Motor',
    mileage: 5000,
    description: 'Experience the future of driving with this high-performance electric vehicle.',
    imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2671&auto=format&fit=crop',
  },
  {
    make: 'Ford',
    model: 'Mustang',
    year: 2022,
    color: 'Blue',
    pricePerDay: 95.0,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    seats: 4,
    engine: '5.0L V8',
    mileage: 12000,
    description: 'Classic American muscle car with powerful performance and stunning looks.',
    imageUrl: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?q=80&w=2670&auto=format&fit=crop',
  },
  {
    make: 'BMW',
    model: 'X5',
    year: 2024,
    color: 'Black',
    pricePerDay: 150.0,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    seats: 5,
    engine: '3.0L 6-Cylinder',
    mileage: 3000,
    description: 'Luxury SUV offering exceptional comfort, style, and driving dynamics.',
    imageUrl: 'https://images.unsplash.com/photo-1556189250-72ba954522af?q=80&w=2670&auto=format&fit=crop',
  },
  {
    make: 'Honda',
    model: 'Civic',
    year: 2021,
    color: 'Silver',
    pricePerDay: 45.0,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    seats: 5,
    engine: '1.5L Turbo',
    mileage: 25000,
    description: 'Practical and sporty compact car, great for daily commuting.',
    imageUrl: 'https://images.unsplash.com/photo-1605812860427-4024433a70fd?q=80&w=2670&auto=format&fit=crop',
  },
];

async function main() {
  console.log('🌱 Starting seed...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const userPassword = await bcrypt.hash('User@123', 12);

  // 1. Create Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@myrobin.com' },
    update: { password: adminPassword },
    create: {
      email: 'admin@myrobin.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      drivingLicenceNumber: 'ADMIN12345',
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: { password: userPassword },
    create: {
      email: 'user1@example.com',
      password: userPassword,
      name: 'John Doe',
      role: 'USER',
      drivingLicenceNumber: 'DL12345678',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: { password: userPassword },
    create: {
      email: 'user2@example.com',
      password: userPassword,
      name: 'Jane Smith',
      role: 'USER',
      drivingLicenceNumber: 'DL87654321',
    },
  });

  console.log('✅ Users seeded');

  // 2. Create Cars
  const createdCars = [];
  for (const carData of cars) {
    let car = await prisma.car.findFirst({
      where: { make: carData.make, model: carData.model, year: carData.year }
    });

    if (!car) {
      car = await prisma.car.create({
        data: {
          ...carData,
          // Create a primary image for each car
          images: {
            create: {
              imageUrl: carData.imageUrl,
              isPrimary: true,
            }
          }
        }
      });
    }
    createdCars.push(car);
  }

  console.log(`✅ ${createdCars.length} Cars seeded`);

  // 3. Create Rentals
  // Active rental for User 1
  if (createdCars.length > 0) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 3); // 3 days rental

    const existing = await prisma.rental.findUnique({
        where: {
            userId_carId_startDate: {
                userId: user1.id,
                carId: createdCars[0].id,
                startDate: startDate
            }
        }
    });

    if (!existing) {
        await prisma.rental.create({
            data: {
              userId: user1.id,
              carId: createdCars[0].id,
              startDate: startDate,
              endDate: endDate,
              totalPrice: createdCars[0].pricePerDay * 3,
              status: RentalStatus.ACTIVE,
            },
          });
    }
  }

  // Completed rental for User 2
  if (createdCars.length > 1) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 10); // 10 days ago
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 5); // 5 days rental (ended 5 days ago)

    const existing = await prisma.rental.findFirst({
        where: { userId: user2.id, carId: createdCars[1].id, status: RentalStatus.COMPLETED }
    });

    if (!existing) {
        await prisma.rental.create({
            data: {
              userId: user2.id,
              carId: createdCars[1].id,
              startDate: startDate,
              endDate: endDate,
              totalPrice: createdCars[1].pricePerDay * 5,
              status: RentalStatus.COMPLETED,
            },
          });
    }
  }

  // Pending rental for User 1
  if (createdCars.length > 2) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 5); // Starts in 5 days
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7); // 2 days rental

    const existing = await prisma.rental.findFirst({
        where: { userId: user1.id, carId: createdCars[2].id, status: RentalStatus.PENDING }
    });

    if (!existing) {
        await prisma.rental.create({
            data: {
              userId: user1.id,
              carId: createdCars[2].id,
              startDate: startDate,
              endDate: endDate,
              totalPrice: createdCars[2].pricePerDay * 2,
              status: RentalStatus.PENDING,
            },
          });
    }
  }

  console.log('✅ Rentals seeded');
  console.log('\n--- Seed Summary ---');
  console.log('Admin credentials: admin@myrobin.com / Admin@123');
  console.log('User1 credentials: user1@example.com / User@123');
  console.log('User2 credentials: user2@example.com / User@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
