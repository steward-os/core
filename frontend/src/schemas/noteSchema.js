import { z } from 'zod';

export const noteSchema = z.object({
  name: z.string().min(1, 'Titel is verplicht'),
  type: z.string().min(1, 'Type is verplicht'),
  state: z.string().min(1, 'Status is verplicht'),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
  project: z.string().optional(),
});