import { z } from "zod/v4";
import { ulid } from "jsr:@std/ulid";
import * as schemas from "../deno_kv/schemas.ts"
import { assertEquals } from "$std/assert/assert_equals.ts";

type UserCreate = z.infer<typeof schemas.ZUserCreate>
type User = z.infer<typeof schemas.ZUser>
type DbError = z.infer<typeof schemas.ZDbError>
type Uuid = z.infer<typeof schemas.ZUuid>
type Email = z.infer<typeof schemas.ZEmail>

const primaryKeyName = schemas.ZDbKeys.enum.Users
const secondaryKeyName = schemas.ZDbKeys.enum.UsersByEmail

const createUserTest = async (
    kv: Deno.Kv,
    userData: UserCreate
): Promise<User | DbError> => {
        const user_parse = schemas.ZUserCreate.safeParse(userData)

        if (!user_parse.success) {
            return schemas.ZDbError.parse({
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
            return schemas.ZDbError.parse({
                error: "USER_EXISTS",
                message: "Create user failed. User already exists."
            })
        }
    
        return newUser
}

const getUserByIdTest = async (
    uid: Uuid, 
    kv: Deno.Kv
): Promise<User | DbError | null> => {
    const uid_validate = schemas.ZUuid.safeParse(uid)

    if (!uid_validate.success) {
        return schemas.ZDbError.parse({
            error: uid_validate.error,
            message: "Invalid UID format"
        })
    }

    return (await kv.get<User>([primaryKeyName, uid])).value
}

const getUserByEmailTest = async (
    email: Email,
    kv: Deno.Kv
): Promise<User | DbError | null> => {
    const email_validate = schemas.ZEmail.safeParse(email)

    if (!email_validate.success) {
        return schemas.ZDbError.parse(({
            error: email_validate.error,
            message: "Invalid email"
        }))
    }
    
    return (await kv.get<User>([secondaryKeyName, email])).value
}

const deleteUserTest = async ( uid: Uuid, kv: Deno.Kv ): Promise<DbError | undefined> => {
    const uid_validate = schemas.ZUuid.safeParse(uid)

    if (!uid_validate.success) {
        return schemas.ZDbError.parse({
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

Deno.test("Users", async (t) => {
    const kv = await Deno.openKv(":memory:")

    await t.step("Create New User", async () => {
        const newUser = schemas.ZUserCreate.parse({
            id: ulid(),
            first_name: "Test",
            last_name: "User",
            email: "test@example.com"
        })

        const res = await createUserTest(kv, newUser);
        assertEquals(res, newUser as User)
    })

    kv.close()
})