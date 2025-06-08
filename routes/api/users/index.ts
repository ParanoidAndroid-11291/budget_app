import { Handlers, FreshContext } from "$fresh/server.ts";
import { State } from "../../_middleware.ts";
import { createUser } from "../../../deno_kv/operations/users.ts";

interface UserCreate {
    id?: string;
    first_name: string;
    last_name: string;
    email: string;
}

export const handler: Handlers<any,State> = {
    async POST(req: Request, ctx: FreshContext<State>) {
        const user = (await req.json()) as UserCreate;
        const { kv } = ctx.state.context;
        
        if (!user.first_name || !user.last_name || !user.email) {
            const error = {
                error: "MISSING_OR_INVALID_PARAMS",
                message: "One or more params are missing or invalid in the request."
            }

            return new Response(JSON.stringify(error),{
                status: 400,
                headers: { "Content-Type": "application/json"}
            })
        }

        const res = await createUser(user, kv);

        if (!res.ok) {
            const error = {
                error: "RECORD_EXISTS",
                message: "A user already exists with this email"
            }

            return new Response(JSON.stringify(error),{
                status: 400,
                headers: {"Content-Type": "application/json"}
            })
        }

        return new Response(JSON.stringify(res),{
            status: 201,
            headers: {"Content-Type": "application/json"}
        })


    }
}