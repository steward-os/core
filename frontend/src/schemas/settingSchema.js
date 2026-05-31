import { z } from 'zod';

export const settingSchema = z.object({
  app_name: z.string().min(1, 'App naam is verplicht'),
});
