import { z } from 'zod';

export const meetingTemplateSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  description: z.string().optional(),
  topics: z.array(z.string()).optional(),
});