import { z } from "zod";

export const parameterSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  value: z.string().min(1, "Waarde is verplicht"),
  description: z.string().optional(),
});
