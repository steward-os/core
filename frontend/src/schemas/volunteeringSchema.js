import { z } from 'zod';

export const volunteeringSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  date_time: z.string().min(1, 'Datum en tijd is verplicht'),
  number_needed: z.number().min(1, 'Aantal moet minimaal 1 zijn'),
  number_orange: z.number().min(0).optional(),
  number_red: z.number().min(0).optional(),
  description: z.string().optional(),
});