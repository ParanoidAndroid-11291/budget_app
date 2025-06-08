import { Handlers, FreshContext } from "$fresh/server.ts";
import { State } from "../../_middleware.ts";
import { 
    createUser, 
    getUserById, 
    getUserByEmail, 
    deleteUser, 
    UserCreate 
} from "../../../deno_kv/operations/users.ts";
import { User } from "../../../deno_kv/types.ts";


export const handler: Handlers<any,State> = {
    async GET(req: Request, ctx: FreshContext<State>) {
        const params = new URL(req.url).searchParams;

        let user: User | null = null;
        const { kv } = ctx.state.context;

        if (params.has('id')) {
            const id = params.get('id')?.toString();

            if (id) user = await getUserById(id,kv)
            else {
                const error = {
                    error: "UNDEFINED_PARAM",
                    message: "Parameter 'id' is undefined"
                }
                return new Response(JSON.stringify(error),{
                    status: 400,
                    headers: {"Content-Type": "application/json"}
                })
            }
            
        } else if (params.has('email')) {
            const email = params.get('email')?.toString();
            if (email) user = await getUserByEmail(email,kv)
            else {
                const error = {
                    error: "UNDEFINED_PARAM",
                    message: "Parameter 'email' is undefined"
                }
                return new Response(JSON.stringify(error),{
                    status: 400,
                    headers: {"Content-Type": "application/json"}
                })
            }
        } else {
            const error = {
                error: "MISSING_PARAM",
                message: "Missing required parameter 'id' or 'email'"
            }
            return new Response(JSON.stringify(error),{
                    status: 400,
                    headers: {"Content-Type": "application/json"}
                })
        }

        if (!user) {
            const error = {
                error: "NO_RECORD_FOUND",
                message: "User not found"
            }
            return new Response(JSON.stringify(error),{
                    status: 400,
                    headers: {"Content-Type": "application/json"}
                })
        }

        return new Response(JSON.stringify(user),{
            status: 200,
            headers: {"Content-Type": "application/json"}
        })
    },
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


    },
    async DELETE(req: Request, ctx: FreshContext<State>) {
        const params = new URL(req.url).searchParams;
        const { kv } = ctx.state.context;

        const id = params.get("id")?.toString();

        if (!id) {
            const error = {
                error: "MISSING_OR_INVALID_PARAMS",
                message: "One or more params are missing or invalid in the request."
            }

            return new Response(JSON.stringify(error),{
                status: 400,
                headers: { "Content-Type": "application/json"}
            });
        }

        await deleteUser(id,kv);

        return new Response(null,{
            status: 202
        })

    }
}