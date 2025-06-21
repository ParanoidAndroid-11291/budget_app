import { Handlers, FreshContext } from "$fresh/server.ts";
import { State } from "./_middleware.ts";
import Chart from "../islands/Chart.tsx";

export const handler: Handlers<any,State> = {
  GET(_req: Request, ctx: FreshContext<State>) {
    return ctx.render()
  }
}

export default function Home() {
  return (
    <div class="w-screen px-10 py-5 flex flex-col">
      <div class="w-full h-fit px-8">
          <Chart />
      </div>
      <div class="w-full h-5 my-5 bg-slate-400">

      </div>
    </div>
  );
}
