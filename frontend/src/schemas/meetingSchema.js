import { z } from 'zod';

export const meetingSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  date_time: z.string().min(1, 'Datum en tijd is verplicht'),
  meeting_template: z.string().optional(),
});