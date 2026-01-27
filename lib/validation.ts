import { z } from 'zod';

export const formValidation = z.object({
  firstName: z
    .string()
    .min(2, 'First Name must be at least 2 characters')
    .optional(),
  lastName: z.string().min(1, 'Last Name is required').optional(),
  email: z.string().email({ message: 'Email address is invalid' }).optional(),
});

export const formSchema = (formType: 'create-user') => {
  switch (formType) {
    case 'create-user':
      return formValidation.pick({
        firstName: true,
        lastName: true,
        email: true,
      });
    default:
      throw new Error('Invalid form type');
  }
};
