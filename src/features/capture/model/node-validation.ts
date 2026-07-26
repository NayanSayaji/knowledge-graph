import { z } from "zod";

const shortMetadataValue = z
  .string()
  .trim()
  .max(25, "Sections, tags, and keywords must be 25 characters or fewer.");

export const nodeSchema = z.object({
  title: z.string().trim().min(1, "Give this node a title."),
  sections: z.array(shortMetadataValue),
  tags: z.array(shortMetadataValue),
  keywords: z.array(shortMetadataValue),
});
