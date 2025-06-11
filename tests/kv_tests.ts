import { z } from "zod/v4";
import { ulid } from "jsr:@std/ulid";
import * as schemas from "../deno_kv/schemas.ts"
import { assertEquals } from "$std/assert/assert_equals.ts";
import { assert } from "$std/assert/assert.ts";

/* ********************************************************
* USERS CRUD TEST
******************************************************** */

type UserCreate = z.infer<typeof schemas.ZUserCreate>
type User = z.infer<typeof schemas.ZUser>
type DbError = z.infer<typeof schemas.ZDbError>
type Uuid = z.infer<typeof schemas.ZUuid>
type Email = z.infer<typeof schemas.ZEmail>

const primaryUsersKeyName = schemas.ZDbKeys.enum.Users
const secondaryUsersKeyName = schemas.ZDbKeys.enum.UsersByEmail


const createUser = async (
    userData: UserCreate,
    kv: Deno.Kv
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
    
        const primaryKey = schemas.ZUsersTbKey.parse([primaryUsersKeyName,uid])
        const secondaryKey = schemas.ZUsersEmailTbKey.parse([secondaryUsersKeyName, newUser.email])
    
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

const getUserById = async (
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

    const primaryKey = schemas.ZUsersTbKey.parse([primaryUsersKeyName,uid])

    return (await kv.get<User>(primaryKey)).value
}

const getUserByEmail = async (
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

    const secondaryKey = schemas.ZUsersEmailTbKey.parse([secondaryUsersKeyName, email])
    
    return (await kv.get<User>(secondaryKey)).value
}

const deleteUser = async ( uid: Uuid, kv: Deno.Kv ): Promise<DbError | undefined> => {
    const uid_validate = schemas.ZUuid.safeParse(uid)

    if (!uid_validate.success) {
        return schemas.ZDbError.parse({
            error: uid_validate.error,
            message: "Invalid UID format"
        })
    }

    let res = { ok: false }
    const primaryKey = schemas.ZUsersTbKey.parse([primaryUsersKeyName,uid])
    do {
        const getUser = await kv.get<User>(primaryKey);
        if (getUser.value === null) return;

        const secondaryKey = schemas.ZUsersEmailTbKey.parse([secondaryUsersKeyName, getUser.value.email])
        res = await kv.atomic()
        .check(getUser)
        .delete(primaryKey)
        .delete(secondaryKey)
        .commit();
    } while (!res.ok);

}

Deno.test("Users", async (t) => {
    const kv = await Deno.openKv(":memory:")

    await t.step("Create User with ID", async () => {
        const newUser = schemas.ZUserCreate.parse({
            id: ulid(),
            first_name: "Test",
            last_name: "User",
            email: "test@example.com"
        })

        const res = await createUser(newUser,kv);
        assertEquals(res, newUser as User)
    })

    await t.step("Get existing user", async () => {
        const testEmail = "test@example.com"

        const resGetUserEmail = await getUserByEmail(testEmail,kv) as User
        assertEquals(resGetUserEmail.email,testEmail)

        const resGetUserId = await getUserById(resGetUserEmail.id,kv) as User
        assertEquals(resGetUserId,resGetUserEmail)

    })

    await t.step("Try create existing user", async () => {
        const existingUser = schemas.ZUserCreate.parse({
            first_name: "Already",
            last_name: "Exists",
            email: "test@example.com"
        })

        const res = await createUser(existingUser, kv) as DbError
        assert(schemas.ZDbError.safeParse(res).success)
    })

    await t.step("Delete user", async () => {
        const user = await getUserByEmail("test@example.com",kv) as User

        const res = await deleteUser(user.id,kv)
        assertEquals(res,undefined)
    })

    kv.close()
})

/* ********************************************************
* TRANSACTIONS CRUD TEST
******************************************************** */

const transactionTbKey = schemas.ZDbKeys.enum.Transactions

type TransactionCreate = z.infer<typeof schemas.ZTransactionCreate>
type Transaction = z.infer<typeof schemas.ZTransaction>

const createTransaction = async (userId: Uuid, data: TransactionCreate, kv: Deno.Kv): Promise<Transaction | DbError> => {

    const user = await getUserById(userId, kv)
    const checkUser = schemas.ZUser.safeParse(user)
    const checkData = schemas.ZTransactionCreate.safeParse(data)

    if (!checkUser.success) {
        return schemas.ZDbError.parse({
            error: checkUser.error,
            message: "Invalid user ID"
        })
    }

    if (!checkData.success) {
        return schemas.ZDbError.parse({
            error: checkData.error,
            message: "Invalid transaction data"
        })
    }

    const newTransaction = schemas.ZTransaction.parse({
        ...data,
        id: ulid(),
        timestamp: new Date().toISOString()
    })

    const key = schemas.ZTransactionsTbKey.parse([userId,transactionTbKey])
    const res = await kv.set(key,newTransaction)

    if (!res.ok) return schemas.ZDbError.parse({
        error: "TRANSACTION_CREATE_ERROR",
        message: "Transaction creation failed"
    })

    return newTransaction
}

const getTransaction = async () => {}

const getTransactionsByDateRange = async () => {}

const updateTransaction = async () => {}

const deleteTransaction = async () => {}

Deno.test("Transactions", async (t) => {
    const kv = await Deno.openKv(":memory:")

    await t.step("User creates new transaction", async () => {
        const newUser = schemas.ZUserCreate.parse({
            first_name: "Test",
            last_name: "User",
            email: "test@example.com"
        })

        const res = await createUser(newUser,kv);

        const testTransaction = schemas.ZTransactionCreate.parse({
            amount: 100.00,
            currency: "US",
            comment: "test"
        })
    })
})