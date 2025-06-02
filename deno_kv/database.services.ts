import "jsr:@std/dotenv/load";

const uri = Deno.env.get("KV_URI")

export const connectToDatabase = async () => await Deno.openKv(uri)

// export const connectToDatabase = async () => {
//     try {
//        return await Deno.openKv(uri)
//     } catch(err: any) {
//         throw new Error("Cannot connect to KV database",err)
//     }
// }