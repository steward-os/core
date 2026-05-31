import { z } from "zod";

export const mediaFileSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
});
