import { z } from "zod";

export const GROUP_TYPES = [
  { value: "orchestra", label: "Orkest groep" },
  { value: "message", label: "Bericht groep" },
];

export const groupSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  type: z.string().min(1, "Type is verplicht"),
});
