import { ulid } from "jsr:@std/ulid";
import { 
    ZUser, 
    ZUserCreate, 
    ZUuid, 
    ZEmail,
    ZUsersTbKey,
    ZUsersEmailTbKey,
    ZOpsResult,
    ZTbOpsKeyEnum,
    ZTbOpsKeys,
    getTbKey,
    ZUserUpdate
 } from "../schemas.ts";
import { z } from "zod/v4";

const userSingletonOp = ZTbOpsKeyEnum.enum.UserSingleton
const userEmailSingletonOp = ZTbOpsKeyEnum.enum.EmailUserSingleton

/*
 * INFERED TYPES 
 */

type User = z.infer<typeof ZUser>
type UsersTbKey = z.infer<typeof ZUsersTbKey>
type UsersEmailTbKey = z.infer<typeof ZUsersEmailTbKey>
type UserCreate = z.infer<typeof ZUserCreate>
type UserUpdate = z.infer<typeof ZUserUpdate>
type OpsResult = z.infer<typeof ZOpsResult>
type Uuid = z.infer<typeof ZUuid>
type Email = z.infer<typeof ZEmail>
type TbOpsKeys = z.infer<typeof ZTbOpsKeys>

/*
* CRUD Operations 
*/

export const createUser = async (userData: UserCreate, kv: Deno.Kv): Promise<OpsResult> => {

    const user_parse = ZUserCreate.safeParse(userData)

    if (!user_parse.success) {
        return ZOpsResult.parse({
            ok: false,
            error: user_parse.error,
            message: "Invalid input for userData"
        })
    }

    const user = user_parse.data

    const uid = ulid()
    const newUser: User = {...user, id: uid }

    const tbKeys  = getTbKey(
        [userSingletonOp, userEmailSingletonOp],
        { userId: newUser.id, email: newUser.email }) as Array<TbOpsKeys>
    
    const primaryKey = tbKeys.find(({ opsKey }) => opsKey === userSingletonOp)?.tbKey as UsersTbKey
    const secondaryKey = tbKeys.find(({ opsKey }) => opsKey == userEmailSingletonOp)?.tbKey as UsersEmailTbKey

    const res = await kv.atomic()
        .check({ key: primaryKey, versionstamp: null})
        .check({ key: secondaryKey, versionstamp: null})
        .set(primaryKey, newUser)
        .set(secondaryKey,newUser)
        .commit();

    const opsRes = ZOpsResult.parse(res)
    
    if (!opsRes.ok) {
        return ZOpsResult.parse({
            ...opsRes,
            error: "USER_EXISTS",
            message: "Create user failed. User already exists."
        })
    }

    return ZOpsResult.parse({
        ...opsRes,
        value: newUser
    })
}

export const updateUser = async ( updateData: UserUpdate, kv: Deno.Kv) => {
    const checkData = ZUserCreate.safeParse(updateData)

    if (!checkData.success) {
        return ZOpsResult.parse({
            ok: false,
            error: checkData.error,
            message: "Invalid update data"
        })
    }

    const getPrimaryKey = getTbKey([userSingletonOp],{ userId: updateData.id }) as TbOpsKeys
    const primaryKey = getPrimaryKey.tbKey as UsersTbKey
    let res = ZOpsResult.parse({ ok: false })
    do {
        const userRes = await kv.get<User>(primaryKey)
        if (!userRes.value) {
            return ZOpsResult.parse({
                ok: false,
                error: "RECORD_NOT_FOUND",
                message: "No record found for user update"
            })
        }

        const user = userRes.value as User
        const getEmailKey = getTbKey([userEmailSingletonOp], { email: user.email }) as TbOpsKeys
        const emailKey = getEmailKey.tbKey
        const userEmailRes = await kv.get<User>(emailKey)
        if (!userEmailRes.value) {
            return ZOpsResult.parse({
                ok: false,
                error: "RECORD_NOT_FOUND",
                message: "No record found for user update"
            })
        }

        const updatedUser = ZUser.parse({ ...user, ...updateData })

        res = await kv.atomic()
            .check(userRes)
            .check(userEmailRes)
            .set(primaryKey,updatedUser)
            .set(emailKey,updatedUser)
            .commit()

        if (res.ok) {
            res.value = updatedUser
            break
        }

    }while(true)
    
    return res
}

export const getUserById = async (
    uid: Uuid, 
    kv: Deno.Kv
): Promise<OpsResult> => {
    const uid_validate = ZUuid.safeParse(uid)

    if (!uid_validate.success) {
        return ZOpsResult.parse({
            ok: false,
            error: uid_validate.error,
            message: "Invalid UID format"
        })
    }

    const tbKeys = getTbKey([userSingletonOp], { userId: uid }) as TbOpsKeys
    const primaryKey = tbKeys.tbKey as UsersTbKey

    const { value, versionstamp } = await kv.get<User>(primaryKey)
    return ZOpsResult.parse({
        ok: true,
        value,
        versionstamp
    })
}

export const getUserByEmail = async (
    email: Email,
    kv: Deno.Kv
): Promise<OpsResult> => {
    const email_validate = ZEmail.safeParse(email)

    if (!email_validate.success) {
        return ZOpsResult.parse(({
            ok: false,
            error: email_validate.error,
            message: "Invalid email"
        }))
    }

    const tbKeys = getTbKey([userEmailSingletonOp], { email }) as TbOpsKeys
    const secondaryKey = tbKeys.tbKey as UsersEmailTbKey
    
    const { value, versionstamp } = await kv.get<User>(secondaryKey)
    return ZOpsResult.parse({
        ok: true,
        value,
        versionstamp
    })
}

export const deleteUser = async ( uid: Uuid, kv: Deno.Kv ): Promise<OpsResult | undefined> => {
    const uid_validate = ZUuid.safeParse(uid)

    if (!uid_validate.success) {
        return ZOpsResult.parse({
            ok: false,
            error: uid_validate.error,
            message: "Invalid UID format"
        })
    }

    let res = { ok: false }
    const tbKeys = getTbKey([userSingletonOp], { userId: uid }) as TbOpsKeys
    const primaryKey = tbKeys.tbKey as UsersTbKey
    do {
        const getUser = await kv.get<User>(primaryKey);
        if (getUser.value === null) return;

        const tbKeys = getTbKey([userEmailSingletonOp], { email: getUser.value.email }) as TbOpsKeys
        const secondaryKey = tbKeys.tbKey as UsersEmailTbKey
        res = await kv.atomic()
        .check(getUser)
        .delete(primaryKey)
        .delete(secondaryKey)
        .commit();
    } while (!res.ok);

}