import { z } from "zod";

export const nodeSchema = z.object({
  title: z.string().trim().min(1, "Give this node a title."),
});
