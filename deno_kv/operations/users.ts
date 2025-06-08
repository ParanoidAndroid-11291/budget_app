import { ulid } from "jsr:@std/ulid";
import { User, DbKeys } from "../types.ts";

interface UserCreate {
    id?: string;
    first_name: string;
    last_name: string;
    email: string;
}

const primaryKeyName = DbKeys.Users;
const secondaryKeyName = DbKeys.UsersByEmail;

export const createUser = async (user: UserCreate, kv: Deno.Kv) => {

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