import { ulid } from "jsr:@std/ulid";
import { ZUser, ZUserCreate, ZUuid, ZEmail, ZDbKeys, ZDbError } from "../schemas.ts";
import { z } from "zod/v4";

const primaryKeyName = ZDbKeys.enum.Users;
const secondaryKeyName = ZDbKeys.enum.UsersByEmail;

type User = z.infer<typeof ZUser>
type UserCreate = z.infer<typeof ZUserCreate>
type DbError = z.infer<typeof ZDbError>
type Uuid = z.infer<typeof ZUuid>
type Email = z.infer<typeof ZEmail>

export const createUser = async (userData: UserCreate, kv: Deno.Kv): Promise<User | DbError> => {

    const user_parse = ZUserCreate.safeParse(userData)

    if (!user_parse.success) {
        return ZDbError.parse({
            error: user_parse.error,
            message: "Invalid input for userData"
        })
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
    
    if (!res.ok) {
        return ZDbError.parse({
            error: "USER_EXISTS",
            message: "Create user failed. User already exists."
        })
    }

    return newUser
}

export const getUserById = async (
    uid: Uuid, 
    kv: Deno.Kv
): Promise<User | DbError | null> => {
    const uid_validate = ZUuid.safeParse(uid)

    if (!uid_validate.success) {
        return ZDbError.parse({
            error: uid_validate.error,
            message: "Invalid UID format"
        })
    }

    return (await kv.get<User>([primaryKeyName, uid])).value
}

export const getUserByEmail = async (
    email: Email,
    kv: Deno.Kv
): Promise<User | DbError | null> => {
    const email_validate = ZEmail.safeParse(email)

    if (!email_validate.success) {
        return ZDbError.parse(({
            error: email_validate.error,
            message: "Invalid email"
        }))
    }
    
    return (await kv.get<User>([secondaryKeyName, email])).value
}

export const deleteUser = async ( uid: Uuid, kv: Deno.Kv ): Promise<DbError | undefined> => {
    const uid_validate = ZUuid.safeParse(uid)

    if (!uid_validate.success) {
        return ZDbError.parse({
            error: uid_validate.error,
            message: "Invalid UID format"
        })
    }

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