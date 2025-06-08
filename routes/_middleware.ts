import "jsr:@std/dotenv/load";
import { FreshContext } from "$fresh/server.ts";

export interface State {
    context: Context
}

export class Context {
    private static context: Context;
    private static uri: string | undefined = Deno.env.get("KV_URI")
    readonly kv: Deno.Kv;

    public constructor(kv: Deno.Kv) {
        console.debug("Context initialized!")
        this.kv = kv;
    }

    public static async init() {
        if (!this.uri) throw new Error("Deno KV URI not found!")
        
        const kv = await Deno.openKv(this.uri);
        Context.context = new Context(kv)
    }

    public static instance() {
        if (this.context) return this.context;
        else throw new Error("Context not initialized!")
    }
}


export const handler = async (_req: Request, ctx: FreshContext<State>) => {
    ctx.state.context = Context.instance();
    return await ctx.next()
}