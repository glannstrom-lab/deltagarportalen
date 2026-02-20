import { z } from 'zod';

// Starkare lösenordskrav för ökad säkerhet
const passwordSchema = z.string()
  .min(10, 'Lösenordet måste vara minst 10 tecken')
  .regex(/[A-Z]/, 'Lösenordet måste innehålla minst en stor bokstav')
  .regex(/[a-z]/, 'Lösenordet måste innehålla minst en liten bokstav')
  .regex(/[0-9]/, 'Lösenordet måste innehålla minst en siffra')
  .regex(/[^A-Za-z0-9]/, 'Lösenordet måste innehålla minst ett specialtecken');

export const loginSchema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
  password: z.string().min(1, 'Lösenord krävs'),
});

export const registerSchema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
  password: passwordSchema,
  firstName: z.string().min(1, 'Förnamn krävs').max(100, 'Förnamnet är för långt'),
  lastName: z.string().min(1, 'Efternamn krävs').max(100, 'Efternamnet är för långt'),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Nuvarande lösenord krävs'),
  newPassword: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
