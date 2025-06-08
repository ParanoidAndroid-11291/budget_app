import { Handlers, FreshContext } from "$fresh/server.ts";
import { State } from "../../_middleware.ts";
import { getUserById, getUserByEmail, deleteUser } from "../../../deno_kv/operations/users.ts";
import { User } from "../../../deno_kv/types.ts";

// export const handler: Handlers<any, State> = {
//     async GET(_req: Request, ctx: FreshContext<State>) {
//         const id = ctx.params.id;
//     }
// }