import { Handlers, FreshContext, PageProps } from "$fresh/server.ts";
import { State } from "./_middleware.ts";
import Chart from "../islands/Chart.tsx";
import moment from "moment"
import { ZTransaction } from "../deno_kv/schemas.ts";
import { ApiResponse } from "./api/_api_schemas.ts";
import { z } from "zod/v4"

const TransactionsList = z.array(ZTransaction)

type ApiResponse = z.infer<typeof ApiResponse>
// type Transaction = z.infer<typeof ZTransaction>

// export const handler: Handlers<any,State> = {
//   async GET(req: Request, ctx: FreshContext<State>) {
//     const url = new URL("/api/transactions", req.url)
//     url.searchParams.set("userId","01JX8XE6G424T2C8KX27CDJAYK")
//     const date = moment("2025-06-17").format("YYYY-MM-DD").toString()
//     url.searchParams.set("startDate",date)

//     const res = await fetch(url)
//     console.debug("res",res)
//     try {
//       const transactions = await TransactionsList.parseAsync(res.json())
//       console.debug("transactions",transactions)

//       return ctx.render(transactions)

//     } catch(err) {
//       if (err instanceof z.ZodError) {
//         return ctx.renderNotFound(err.issues)
//       }
//     }
//   }
// }

export default async (req: Request, ctx: FreshContext<State>) => {
  const url = new URL("/api/transactions", req.url)
  url.searchParams.set("userId","01JX8XE6G424T2C8KX27CDJAYK")
  const date = moment("2025-06-17").format("YYYY-MM-DD").toString()
  url.searchParams.set("startDate",date)

  const res = await fetch(url)
  console.debug("res",res)
  try {
    const transactions = await ApiResponse.parseAsync(res.json())
    console.debug("transactions",transactions)

    if (!transactions.success) {
      return ctx.renderNotFound({ message: transactions.error })
    }

    return (
    <div class="w-screen px-10 py-5 flex flex-col">
      <div class="w-full h-fit px-8">
          <Chart data={transactions.data}/>
      </div>
      <div class="w-full h-5 my-5 bg-slate-400">

      </div>
    </div>
  );

  } catch(err) {
    if (err instanceof z.ZodError) {
      return ctx.renderNotFound(err.issues)
    }
  }
}