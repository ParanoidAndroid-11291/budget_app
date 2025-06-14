import { Handlers, FreshContext } from "$fresh/server.ts";
import { State } from "../../_middleware.ts";
import { 
    createUser, 
    getUserById, 
    getUserByEmail, 
    deleteUser
} from "../../../deno_kv/operations/users.ts";
import { 
    ZUserCreate,
    ZUserUpdate,
    ZOpsResult
 } from "../../../deno_kv/schemas.ts";
import { ApiResponse } from "../_api_schemas.ts";
import { z } from "zod/v4";

const PutOpsEnum = z.enum(["create","update"])

type UserCreate = z.infer<typeof ZUserCreate>
type OpsResult = z.infer<typeof ZOpsResult>
type UserUpdate = z.infer<typeof ZUserUpdate>


export const handler: Handlers<any,State> = {
    async GET(req: Request, ctx: FreshContext<State>) {
        const params = new URL(req.url).searchParams;
        const headers = new Headers([["Content-Type","application/json"]])

        let user: OpsResult;
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

        if (!user.ok) {
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
            data: user.value
        })

        return new Response(JSON.stringify(userRes),{
            status: 200,
            headers
        })
    },
    async PUT(req: Request, ctx: FreshContext<State>) {
        const params = new URL(req.url).searchParams;
        const { kv } = ctx.state.context;
        const headers = new Headers([["Content-Type","application/json"]])

        const opsParse = PutOpsEnum.safeParse(params.get('op')?.toString())
        if (!opsParse.success) {
            const error = ApiResponse.parse({
                success: false,
                message: opsParse.error
            })

            return new Response(JSON.stringify(error),{
                status: 400,
                headers
            })
        }
        const operation = opsParse.data

        switch (operation) {
            case PutOpsEnum.enum.create:
                {
                    const user_data = (await req.json()) as UserCreate;

                    const user = ZUserCreate.safeParse(user_data)

                    if (!user.success) {
                        return new Response(JSON.stringify(user.error),{
                            status: 400,
                            headers
                        })
                    }

                    const res = await createUser(user.data, kv) as OpsResult

                    if (!res.ok) {
                        const error = ApiResponse.parse({
                            success: false,
                            message: res.message
                        })

                        return new Response(JSON.stringify(error),{
                            status: 400,
                            headers
                        })
                    }

                    const newUser = ApiResponse.parse({
                        success: true,
                        data: res.value
                    })

                    return new Response(JSON.stringify(newUser),{
                        status: 201,
                        headers
                    })
                }
            case PutOpsEnum.enum.update:
                {
                    const user_data = (await req.json()) as UserUpdate
                    const user = ZUserUpdate.safeParse(user_data)

                    if (!user.success) {
                        const error = ApiResponse.parse({
                            success: false,
                            message: user.error
                        })

                        return new Response(JSON.stringify(error),{
                            status: 400,
                            headers
                        })
                    }

                }
        }
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

        if (res && !res.ok) {
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