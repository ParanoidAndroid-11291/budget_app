import { Handlers, FreshContext } from "$fresh/server.ts";
import { State } from "../../_middleware.ts";
import { 
    createUser, 
    getUserById, 
    getUserByEmail, 
    deleteUser
} from "../../../deno_kv/operations/users.ts";
import { ZUser, ZUserCreate, ZDbError } from "../../../deno_kv/schemas.ts";
import { ApiResponse } from "../_response_schemas.ts";
import { z } from "zod/v4";

type User = z.infer<typeof ZUser>
type UserCreate = z.infer<typeof ZUserCreate>
type DbError = z.infer<typeof ZDbError>


export const handler: Handlers<any,State> = {
    async GET(req: Request, ctx: FreshContext<State>) {
        const params = new URL(req.url).searchParams;
        const headers = new Headers([["Content-Type","application/json"]])

        let user: User | DbError | null = null;
        const { kv } = ctx.state.context;

        if (params.has('id')) {
            const id = params.get('id')?.toString();

            if (id) user = await getUserById(id,kv)
            else {
                const error = ApiResponse.parse({
                    success: false,
                    message: "Parameter 'id' is undefined"
                })

                return new Response(JSON.stringify(error),{
                    status: 400,
                    headers
                })
            }
            
        } else if (params.has('email')) {
            const email = params.get('email')?.toString();
            if (email) user = await getUserByEmail(email,kv)
            else {
                const error = ApiResponse.parse({
                    success: false,
                    message: "Parameter 'email' is undefined"
                })

                return new Response(JSON.stringify(error),{
                    status: 400,
                    headers
                })
            }
        } else {
            const error = ApiResponse.parse({
                    success: false,
                    message: "Missing required parameter 'id' or 'email'"
                })

            return new Response(JSON.stringify(error),{
                    status: 400,
                    headers
                })
        }

        if (!user) {
            const error = ApiResponse.parse({
                    success: false,
                    message: "User not found"
                })

            return new Response(JSON.stringify(error),{
                    status: 400,
                    headers
                })
        }

        if ("error" in user) {
            const error = ApiResponse.parse({
                    success: false,
                    message: user.message
                })

            return new Response(JSON.stringify(error),{
                    status: 400,
                    headers
                })
        }

        const userRes = ApiResponse.parse({
            success: true,
            data: user
        })

        return new Response(JSON.stringify(userRes),{
            status: 200,
            headers
        })
    },
    async POST(req: Request, ctx: FreshContext<State>) {
        const user_data = (await req.json()) as UserCreate;
        const { kv } = ctx.state.context;
        const headers = new Headers([["Content-Type","application/json"]])

        const user = ZUser.safeParse(user_data)

        if (!user.success) {
            return new Response(JSON.stringify(user.error),{
                status: 400,
                headers
            })
        }

        const res = await createUser(user.data, kv);

        if ("error" in res) {
            const error = ApiResponse.parse({
                success: false,
                message: res.message
            })

            return new Response(JSON.stringify(error),{
                status: 400,
                headers
            })
        }

        return new Response(JSON.stringify(res),{
            status: 201,
            headers
        })


    },
    async DELETE(req: Request, ctx: FreshContext<State>) {
        const params = new URL(req.url).searchParams;
        const { kv } = ctx.state.context;
        const headers = new Headers([["Content-Type","application/json"]])

        const id = params.get("id")?.toString();

        if (!id) {
            const error = ApiResponse.parse({
                    success: false,
                    message: "Required param 'id' is missing or undefined"
                })

            return new Response(JSON.stringify(error),{
                status: 400,
                headers
            });
        }

        const res = await deleteUser(id,kv);

        if (res && "error" in res) {
            const error = ApiResponse.parse({
                success: false,
                message: res.message
            })

            return new Response(JSON.stringify(error),{
                status: 400,
                headers
            })
        }

        return new Response(null,{
            status: 202
        })

    }
}