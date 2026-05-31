import { z } from "zod";

export const sessionSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  date_time: z.string().min(1, "Datum en tijd is verplicht"),
  type: z.enum(["rehearsal", "performance", "other"], {
    required_error: "Type is verplicht",
  }),
  groups: z.array(z.string()).min(1, "Selecteer minimaal één groep"),
  default_attendance_state: z.string().optional(),
  description: z.string().optional(),
  rehearsal_marks: z.string().optional(),
  website_youtube_id: z.string().optional(),
  website_text: z.string().optional(),
  website_report: z.string().optional(),
  location: z.string().optional(),
  tickets: z.string().optional(),
  website_tickets_url: z.string().optional(),
  threshold_orange: z.coerce.number().optional(),
  threshold_green: z.coerce.number().optional(),
  website_time: z.string().optional(),
});
