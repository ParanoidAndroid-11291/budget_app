import { Handlers, FreshContext } from "$fresh/server.ts";
import { State } from "../../_middleware.ts"
import moment from "moment"
import { success, z } from "zod/v4"
import {
    createTransaction,
    getTransactionsByDate,
    getTransactionsByDateRange
} from "../../../deno_kv/operations/transactions.ts";
import { 
    ZOpsResult,
    ZUser,
    ZTransaction,
    ZTransactionCreate,
    ZUuid,
    ZDate
} from "../../../deno_kv/schemas.ts";
import { ApiResponse } from "../_api_schemas.ts";

type ApiResponse = z.infer<typeof ApiResponse>
type OpsResult = z.infer<typeof ZOpsResult>
type Uuid = z.infer<typeof ZUuid>

const GetTransactionParams = z.object({
    userId: ZUuid,
    startDate: ZDate,
    endDate: ZDate
}).partial({ endDate: true })

export const handler: Handlers<any,State> = {
    async GET(req: Request, ctx: FreshContext<State>) {
        const { kv } = ctx.state.context;
        const headers = new Headers([["Content-Type","application/json"]])

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

        const { userId, startDate, endDate } = transaction.data

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
    }
}