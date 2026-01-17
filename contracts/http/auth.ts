/**
 * Auth Domain API Contracts
 */

import { z } from 'zod';

export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  profileImageUrl: z.string().url().nullable(),
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
});

export const LoginResponseSchema = AuthUserSchema;

export const GetUserResponseSchema = AuthUserSchema;

export const LogoutResponseSchema = z.object({
  message: z.string(),
});

// Type exports
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type GetUserResponse = z.infer<typeof GetUserResponseSchema>;
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;