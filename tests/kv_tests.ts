import { z } from "zod/v4";
import { ulid } from "jsr:@std/ulid";
import * as schemas from "../deno_kv/schemas.ts"
import { 
    createUser, 
    getUserById, 
    getUserByEmail, 
    deleteUser 
} from "../deno_kv/operations/users.ts"
import { 
    createTransaction, 
    getTransactionById, 
    getTransactionsByDate, 
    updateTransaction, 
    deleteTransaction
} from "../deno_kv/operations/transactions.ts"
import { assertEquals } from "$std/assert/assert_equals.ts";
import { assert } from "$std/assert/assert.ts";
import moment from "moment"

type User = z.infer<typeof schemas.ZUser>
type DbError = z.infer<typeof schemas.ZDbError>


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

Deno.test("Transactions", async (t) => {
    const kv = await Deno.openKv(":memory:")

    await t.step("User creates new transaction", async () => {
        const newUser = schemas.ZUserCreate.parse({
            first_name: "Test",
            last_name: "User",
            email: "test@example.com"
        })

        const user = await createUser(newUser,kv) as User;

        const testTransactionInput = schemas.ZTransactionCreate.parse({
            date: moment.utc(new Date()).format('YYYY-MM-DD'),
            amount: 100.00,
            currency: "US",
            comment: "test"
        })

        const transaction = await createTransaction(user.id,testTransactionInput,kv)
        assert(schemas.ZTransaction.safeParse(transaction).success,JSON.stringify(transaction))
    })

    await t.step("User gets transaction by id", async () => {
        assert(true,"Not implemented")
    })

    await t.step("User gets list of transactions by date", async () => {
        assert(true,"Not implemented")
    })

    await t.step("User updates existing transaction", async () => {
        assert(true,"Not implemented")
    })

    await t.step("User deletes existing transaction", async () => {
        assert(true,"Not implemented")
    })

    kv.close()
})