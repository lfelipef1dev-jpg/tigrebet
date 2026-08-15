import { z } from 'zod';

export const registerSchema = z.object({
  mobile: z.string().min(10, 'Celular deve ter pelo menos 10 dígitos').max(15, 'Celular deve ter no máximo 15 dígitos'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(50, 'Senha muito longa'),
  refCode: z.string().optional(),
});

export const loginSchema = z.object({
  mobile: z.string().min(10, 'Celular deve ter pelo menos 10 dígitos').max(15, 'Celular deve ter no máximo 15 dígitos'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const betSchema = z.object({
  uid: z.string().min(1, 'UID é obrigatório'),
  token: z.string().min(1, 'Token é obrigatório'),
  coin: z.enum(['ETC', 'ETH', 'BTC']),
  amount: z.number().min(1, 'Valor da aposta deve ser maior que 0'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BetInput = z.infer<typeof betSchema>;
