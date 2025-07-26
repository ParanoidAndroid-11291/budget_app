import { FreshContext } from "$fresh/server.ts";
import { State } from "./_middleware.ts";
import moment from "moment"
import Chart from "../islands/Chart.tsx";
import Dashboard from "../islands/Dashboard.tsx";
import { getTransactionsByDate } from "../deno_kv/operations/transactions.ts";
import { ZOpsResult, ZTransaction } from "../deno_kv/schemas.ts"
import { z } from "zod/v4"

const testUserId = "01JX8XE6G424T2C8KX27CDJAYK"
const startDate = moment("2025-06-17").format("YYYY-MM-DD").toString()

const TransactionsList = z.array(ZTransaction)
type TransactionsList = z.infer<typeof TransactionsList>
type OpsResult = z.infer<typeof ZOpsResult>

export default async (_req: Request, ctx: FreshContext<State>) => {
  const { kv } = ctx.state.context

  const data = await getTransactionsByDate(testUserId,startDate,kv) as OpsResult

  if (!data.ok) {
    console.error("transactions error",data)
    return ctx.renderNotFound()
  }

  const transactions: TransactionsList = data.value

  return (
    <div className="w-screen h-fit grid auto-rows-min">
      <div className="w-full h-fit px-8">
          <Chart data={transactions}/>
      </div>
      <Dashboard />
      <div className="w-full h-10 bg-white"></div>
    </div>
  );
}
