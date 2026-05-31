import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  state: z.string().min(1, 'Status is verplicht'),
});