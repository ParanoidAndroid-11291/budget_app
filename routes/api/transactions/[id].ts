import { Handlers, FreshContext} from "$fresh/server.ts";
import { State } from "../../_middleware.ts"
import { z } from "zod/v4"
import {
    updateTransaction,
    getTransactionById,
    deleteTransaction
} from "../../../deno_kv/operations/transactions.ts";
import { 
ZCurrency,
ZDate,
    ZOpsResult,
    ZTransactionUpdate,
    ZUuid
} from "../../../deno_kv/schemas.ts";
import { ApiResponse } from "../_api_schemas.ts";

type ApiResponse = z.infer<typeof ApiResponse>
type OpsResult = z.infer<typeof ZOpsResult>

const PutTransactionParams = z.object({
    userId: ZUuid,
    date: ZDate,
    amount: z.number(),
    currency: ZCurrency,
    comment: z.string()
})
.required({ userId: true })
.partial({ date: true, amount: true, currency: true, comment: true })

const DeleteTransactionParams = z.object({
    userId: ZUuid
}).required()

export const handler: Handlers<any,State> = {
    async GET(req: Request, ctx: FreshContext<State>) {
        const { kv } = ctx.state.context;
        const headers = new Headers([["Content-Type","application/json"]])
        const params = new URL(req.url).searchParams
        const transactionId = ctx.params.id
        const userId = params.get('userId')?.toString()

        if (!userId) {
            const resError = ApiResponse.parse({
                success: false,
                error: "MISSING_REQUIRED_PARAM",
                message: "userId is required"
            })

            return new Response(JSON.stringify(resError),{
                status: 400,
                headers
            })
        }

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

    },
    async PUT(req: Request, ctx: FreshContext<State>) {
        const { kv } = ctx.state.context;
        const headers = new Headers([["Content-Type","application/json"]])
        const transactionId = ctx.params.id
        const body = (await req.json())

        const transaction = PutTransactionParams.safeParse(body)
        if (!transaction.success) {
            const { issues, message } = transaction.error
            const resError = ApiResponse.parse({
                success: false,
                error: issues,
                message
            })
            return new Response(JSON.stringify(resError),{ status: 400, headers })
        }

        let userId = ""
        const temp = {}
        for (const [key,value] of Object.entries(transaction.data)) {
            if (key === "userId") { userId = value as string }
            else { Object.defineProperty(temp, key, { value }) }
        }
        console.debug("temp",temp)
        
        const updateData = ZTransactionUpdate.parse({ ...temp, id: transactionId })
        console.debug("updateData",updateData)

        const res = await updateTransaction(userId,updateData,kv) as OpsResult
        if (!res.ok) {
            const { error, message } = res
            const resError = ApiResponse.parse({
                success: false,
                error,
                message
            })
            return new Response(JSON.stringify(resError),{ status: 400, headers })
        }

        const transactionUpdate = ApiResponse.parse({
            success: true,
            data: res.value
        })
        return new Response(JSON.stringify(transactionUpdate),{ status: 200, headers})
    },
    async DELETE(req: Request, ctx: FreshContext<State>) {
        const { kv } = ctx.state.context;
        const headers = new Headers([["Content-Type","application/json"]])
        const transactionId = ctx.params.id
        const data = (await req.json())

        const dataParse = DeleteTransactionParams.safeParse(data)

        if (!dataParse.success) {
            const { issues, message } = dataParse.error
            const resError = ApiResponse.parse({
                success: false,
                error: issues,
                message
            })

            return new Response(JSON.stringify(resError),{ status: 400, headers })
        }
        const { userId } = dataParse.data
        const res = await deleteTransaction(userId, transactionId, kv)

        if (res && !res.ok) {
            const { error, message } = res
            const resError = ApiResponse.parse({
                success: false,
                error,
                message
            })
            return new Response(JSON.stringify(resError),{ status: 400, headers })
        }

        return new Response(null, { status: 202 })
    }
}