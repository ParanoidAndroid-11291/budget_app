import { FreshContext } from "$fresh/server.ts";
import { connectToDatabase } from "../deno_kv/database.services.ts";

export interface State {
    kv: Deno.Kv
}


export const handler = async (_req: Request, ctx: FreshContext<State>) => {
    ctx.state.kv = await connectToDatabase()
    return await ctx.next()
}