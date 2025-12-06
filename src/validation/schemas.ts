import Joi from 'joi';

// Helper for dynamic year validation
const currentYear = new Date().getFullYear();

// Common validators
const emailValidator = Joi.string().email().trim().lowercase().required();
const optionalEmailValidator = Joi.string().email().trim().lowercase().optional().allow(null, '');
const stringValidator = (min: number = 1, max: number = 255) => 
  Joi.string().trim().min(min).max(max).required();
const optionalStringValidator = (min: number = 1, max: number = 255) => 
  Joi.string().trim().min(min).max(max).optional().allow(null, '');

export const carValidation = Joi.object({
  make: stringValidator(1, 50),
  model: stringValidator(1, 50),
  year: Joi.number().integer().min(1900).max(currentYear + 1).required(),
  color: stringValidator(1, 30),
  pricePerDay: Joi.number().positive().max(100000).required(),
  imageUrl: Joi.string().optional().allow(null, '').custom((value, helpers) => {
    // Allow empty string, null, or valid URI/URL
    if (!value || value === '') return value;
    // Check if it's a valid URI or a relative path starting with /
    if (value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }
    return helpers.error('string.uri', { message: 'imageUrl must be a valid URL or relative path' });
  }),
  fuelType: optionalStringValidator(1, 30), // e.g., "Petrol", "Diesel", "Electric", "Hybrid"
  transmission: optionalStringValidator(1, 30), // e.g., "Manual", "Automatic", "CVT"
  seats: Joi.number().integer().min(2).max(50).optional().allow(null),
  engine: optionalStringValidator(1, 50), // e.g., "2.0L Turbo", "V6"
  mileage: Joi.number().integer().min(0).max(1000000).optional().allow(null), // in km
  description: optionalStringValidator(0, 1000) // Detailed description
});

export const loginValidation = Joi.object({
  email: emailValidator,
  password: Joi.string().required()
});

export const adminValidation = Joi.object({
  email: emailValidator,
  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character'
    }),
  name: stringValidator(2, 100),
  drivingLicenceNumber: stringValidator(5, 50)
});

// Strong password validator - same requirements for all users
const strongPasswordValidator = Joi.string()
  .min(8)
  .max(100)
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*(),.?":{}|<>])'))
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  });

export const userValidation = Joi.object({
  email: emailValidator,
  password: strongPasswordValidator,
  name: stringValidator(2, 100),
  drivingLicenceNumber: optionalStringValidator(5, 50) // Optional during registration
});

export const rentalValidation = Joi.object({
  carId: Joi.number().integer().positive().required(),
  startDate: Joi.date().iso().min('now').required(),
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .required()
    .custom((value, helpers) => {
      const startDate = helpers.state.ancestors[0].startDate;
      if (startDate) {
        const start = new Date(startDate);
        const end = new Date(value);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        if (days < 1) {
          return helpers.error('any.invalid', { message: 'Rental must be at least 1 day' });
        }
        if (days > 30) {
          return helpers.error('any.invalid', { message: 'Rental cannot exceed 30 days' });
        }
      }
      return value;
    }),
  drivingLicenceNumber: optionalStringValidator(5, 50), // Optional - will check if user has it
  additionalInfo: optionalStringValidator(0, 500) // Optional additional information
}).messages({
  'date.min': 'Start date must be in the future',
  'any.invalid': '{{#message}}'
});

export const userUpdateValidation = Joi.object({
  email: optionalEmailValidator,
  name: optionalStringValidator(2, 100),
  imageUrl: Joi.string().uri().optional().allow(null, ''),
  drivingLicenceNumber: optionalStringValidator(5, 50)
}).min(1);

export const passwordChangeValidation = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .max(100)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*(),.?":{}|<>])'))
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    })
});

export const carUpdateValidation = Joi.object({
  make: optionalStringValidator(1, 50),
  model: optionalStringValidator(1, 50),
  year: Joi.number().integer().min(1900).max(currentYear + 1).optional(),
  color: optionalStringValidator(1, 30),
  pricePerDay: Joi.number().positive().max(100000).optional(),
  imageUrl: Joi.string().uri().optional().allow(null, ''),
  available: Joi.boolean().optional(),
  fuelType: optionalStringValidator(1, 30),
  transmission: optionalStringValidator(1, 30),
  seats: Joi.number().integer().min(2).max(50).optional().allow(null),
  engine: optionalStringValidator(1, 50),
  mileage: Joi.number().integer().min(0).max(1000000).optional().allow(null),
  description: optionalStringValidator(0, 1000)
}).min(1);

export const roleUpdateValidation = Joi.object({
  role: Joi.string().valid('GUEST', 'USER', 'ADMIN').required()
});

export const paginationValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});