import { Handlers, FreshContext } from "$fresh/server.ts";
import Chart from "../islands/Chart.tsx";

export const handler: Handlers = {
  GET(_req: Request, ctx: FreshContext) {
    console.debug("kv state",ctx.state.kv)
    return ctx.render()
  }
}

export default function Home() {
  return (
    <div class="w-screen m-8 flex flex-col">
      <Chart />
    </div>
  );
}
