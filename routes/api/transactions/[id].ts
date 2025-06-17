import { Handlers, FreshContext} from "$fresh/server.ts";
import { State } from "../../_middleware.ts"
import { z } from "zod/v4"
import moment from "moment";
import {
    updateTransaction,
    getTransactionById,
    deleteTransaction
} from "../../../deno_kv/operations/transactions.ts";
import { 
    ZOpsResult,
    ZUser,
    ZTransaction,
    ZTransactionUpdate,
    ZUuid,
    ZCurrency,
    ZDate,
    ZEmail
} from "../../../deno_kv/schemas.ts";
import { ApiResponse } from "../_api_schemas.ts";

type ApiResponse = z.infer<typeof ApiResponse>
type OpsResult = z.infer<typeof ZOpsResult>
type Uuid = z.infer<typeof ZUuid>

const GetTransactionParams = z.object({
    userId: ZUuid
})

export const handler: Handlers<any,State> = {
    async GET(req: Request, ctx: FreshContext<State>) {
        const { kv } = ctx.state.context;
        const headers = new Headers([["Content-Type","application/json"]])
        const transactionId = ctx.params.id
        const transData = (await req.json())

        const transaction = GetTransactionParams.safeParse(transData)
        if (!transaction.success) {
            const { issues, message } = transaction.error
            const resError = ApiResponse.parse({
                success: false,
                error: issues,
                message
            })

            return new Response(JSON.stringify(resError),{
                status: 400,
                headers
            })
        }

        const { userId } = transaction.data
        const res = await getTransactionById(userId,transactionId,kv) as OpsResult

        if (!res.ok) {
            const { error, message } = res
            const resError = ApiResponse.parse({
                success: false,
                error,
                message
            })
            return new Response(JSON.stringify(resError),{ status: 400, headers })
        }
        const { value } = res
        return new Response(JSON.stringify(value),{ status: 200, headers})  

    }
}