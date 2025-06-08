import "jsr:@std/dotenv/load";
import { FreshContext } from "$fresh/server.ts";

const kv_uri: string | undefined = Deno.env.get("KV_URI")
const build_env: string | undefined = Deno.env.get("BUILD_ENV");

export interface State {
    context: Context
}

export class Context {
    private static context: Context;
    readonly kv: Deno.Kv;

    public constructor(kv: Deno.Kv) {
        console.debug("Context initialized!")
        this.kv = kv;
    }

    public static async init() {
        let init_kv = undefined;
        switch(build_env) {
            case "dev":
                init_kv = await Deno.openKv(kv_uri);
                break;
            case "prod":
                init_kv = await Deno.openKv();
                break;
            default:
                throw new Error(`BUILD_ENV undefined or unknown value: BUILD_ENV=${build_env}`)
        }

        Context.context = new Context(init_kv)
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