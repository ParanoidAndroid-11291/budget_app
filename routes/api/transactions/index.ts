import { Handlers, FreshContext } from "$fresh/server.ts";
import { State } from "../../_middleware.ts"
import moment from "moment"
import { z } from "zod/v4"
import {
    createTransaction,
    getTransactionsByDate,
    getTransactionsByDateRange
} from "../../../deno_kv/operations/transactions.ts";
import { 
    ZOpsResult,
    ZTransactionCreate,
    ZUuid,
    ZDate,
    ZCurrency
} from "../../../deno_kv/schemas.ts";
import { ApiResponse } from "../_api_schemas.ts";

type ApiResponse = z.infer<typeof ApiResponse>
type OpsResult = z.infer<typeof ZOpsResult>


const PostTransactionParams = z.object({
    userId: ZUuid,
    date: ZDate,
    amount: z.number(),
    currency: ZCurrency,
    comment: z.string()
}).partial({comment: true, currency: true})

export const handler: Handlers<any,State> = {

    async GET(req: Request, ctx: FreshContext<State>) {
        const { kv } = ctx.state.context;
        const headers = new Headers([["Content-Type","application/json"]])
        const params = new URL(req.url).searchParams

        const userId = params.get('userId')?.toString()
        const startDate = params.get('startDate')?.toString()
        const endDate = params.get('endDate')?.toString()

        if (!userId || !startDate) {

            const resError = ApiResponse.parse({
                success: false,
                error: "MISSING_REQUIRED_PARAMS",
                message: "userId and startDate are required params"
            })

            return new Response(JSON.stringify(resError),{
                status: 400,
                headers
            })
        }

        if (endDate) {
            if (!moment(startDate).isBefore(endDate)) {
                const resError = ApiResponse.parse({
                    success: false,
                    error: "INVALID_DATE_RANGE",
                    message: "startDate must be before endDate"
                })
                return new Response(JSON.stringify(resError),{ status: 400, headers })
            }

            const res = await getTransactionsByDateRange(userId, startDate, endDate, kv) as OpsResult

            if (!res.ok) {
                const { error, message } = res
                const resError = ApiResponse.parse({
                    success: false,
                    error,
                    message
                })
                return new Response(JSON.stringify(resError),{ status: 400, headers })
            }

            const transactions = ApiResponse.parse({
                success: true,
                data: res.value
            })

            return new Response(JSON.stringify(transactions),{ status: 200, headers })
        }

        const res = await getTransactionsByDate(userId, startDate, kv) as OpsResult

        if (!res.ok) {
                const { error, message } = res
                const resError = ApiResponse.parse({
                    success: false,
                    error,
                    message
                })
                return new Response(JSON.stringify(resError),{ status: 400, headers })
            }

        const transactions = ApiResponse.parse({
            success: true,
            data: res.value
        })

        return new Response(JSON.stringify(transactions),{ status: 200, headers })
    },

    async POST(req: Request, ctx: FreshContext<State>) {
        const headers = new Headers([["Content-Type","application/json"]])
        const { kv } = ctx.state.context
        const data = await req.json()
        const transactionData = PostTransactionParams.safeParse(data)

        if (!transactionData.success) {
            const { issues, message } = transactionData.error
            const resError = ApiResponse.parse({
                success: false,
                error: issues,
                message
            })

            return new Response(JSON.stringify(resError), { status: 400, headers })
        }

        const { userId, date, amount, currency, comment } = transactionData.data

        const newTransactionData = ZTransactionCreate.parse({
            date,
            amount,
            currency: currency ?? ZCurrency.enum.US,
            comment
        })

        const res = await createTransaction(userId,newTransactionData,kv) as OpsResult

        if (!res.ok) {
            const { error, message } = res
            const resError = ApiResponse.parse({
                success: false,
                error,
                message
            })
            return new Response(JSON.stringify(resError), { status: 400, headers })
        }

        const { value } = res
        const newTransaction = ApiResponse.parse({
            success: true,
            data: value
        })
        return new Response(JSON.stringify(newTransaction),{ status: 201, headers })
    }
}