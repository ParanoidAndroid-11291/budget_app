import { ulid } from "jsr:@std/ulid";
import { User, UserCreate, DbKeys } from "../schemas.ts";
import { z } from "zod/v4";

const primaryKeyName = DbKeys.enum.Users;
const secondaryKeyName = DbKeys.enum.UsersByEmail;

type User = z.infer<typeof User>
type UserCreate = z.infer<typeof UserCreate>

export const createUser = async (userData: UserCreate, kv: Deno.Kv) => {

    const user_parse = UserCreate.safeParse(userData)

    if (!user_parse.success) {
        return user_parse.error
    }

    const user = user_parse.data

    const uid = user.id ?? ulid()
    const newUser: User = {...user, id: uid}

    const primaryKey = [primaryKeyName, uid]
    const secondaryKey = [secondaryKeyName, user.email]

    const res = await kv.atomic()
        .check({ key: primaryKey, versionstamp: null})
        .check({ key: secondaryKey, versionstamp: null})
        .set(primaryKey, newUser)
        .set(secondaryKey,newUser)
        .commit();
    
    return res
}

export const getUserById = async (
    uid: string, 
    kv: Deno.Kv
): Promise<User | null> => (await kv.get<User>([primaryKeyName, uid])).value

export const getUserByEmail = async (
    email: string,
    kv: Deno.Kv
): Promise<User | null> => (await kv.get<User>([secondaryKeyName, email])).value

export const deleteUser = async ( uid: string, kv: Deno.Kv ) => {
    let res = { ok: false }
    do {
        const getUser = await kv.get<User>([primaryKeyName,uid]);
        if (getUser.value === null) return;
        res = await kv.atomic()
        .check(getUser)
        .delete([primaryKeyName, uid])
        .delete([secondaryKeyName,getUser.value.email])
        .commit();
    } while (!res.ok);
}