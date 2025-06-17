import { z } from "zod/v4"

export const ApiResponse = z.discriminatedUnion("success", [
    z.object({ success: z.literal(true), data: z.any() }),
    z.object({ 
        success: z.literal(false), 
        error: z.any(), 
        message: z.string() }).partial({ error: true })
])