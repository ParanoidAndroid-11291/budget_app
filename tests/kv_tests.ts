import { z } from "zod/v4";
import * as schemas from "../deno_kv/schemas.ts"
import { 
    createUser,
    updateUser,
    getUserById, 
    getUserByEmail, 
    deleteUser 
} from "../deno_kv/operations/users.ts"
import { 
    createTransaction, 
    getTransactionById, 
    getTransactionsByDate,
    getAllTransactions,
    updateTransaction, 
    deleteTransaction,
    getTransactionsByDateRange
} from "../deno_kv/operations/transactions.ts"
import { assertEquals } from "$std/assert/assert_equals.ts";
import { assert } from "$std/assert/assert.ts";
import moment from "moment"
import { assertFalse } from "$std/assert/assert_false.ts";

type User = z.infer<typeof schemas.ZUser>
type OpsResult = z.infer<typeof schemas.ZOpsResult>
type Transaction = z.infer<typeof schemas.ZTransaction>


Deno.test("Users", async (t) => {
    const kv = await Deno.openKv(":memory:")

    await t.step("Create User", async () => {
        const newUser = schemas.ZUserCreate.parse({
            first_name: "Test",
            last_name: "User",
            email: "test@example.com"
        })

        const userRes = await createUser(newUser,kv) as OpsResult;
        if (!userRes.ok) throw new Error(JSON.stringify(userRes))
        const user = userRes.value as User

        assert(schemas.ZUser.safeParse(user).success)
    })

    await t.step("Get existing user", async () => {
        const testEmail = "test@example.com"

        const resGetUserEmail = await getUserByEmail(testEmail,kv) as OpsResult
        if (!resGetUserEmail.ok) throw new Error(JSON.stringify(resGetUserEmail))
        const userWithEmail = resGetUserEmail.value as User
        assertEquals(userWithEmail.email,testEmail)

        const resGetUserId = await getUserById(userWithEmail.id,kv) as OpsResult
        if (!resGetUserId.ok) throw new Error(JSON.stringify(resGetUserId))
        const userWithId = resGetUserId.value as User
        
        assertEquals(userWithId,userWithEmail)

    })

    await t.step("Try create existing user", async () => {
        const existingUser = schemas.ZUserCreate.parse({
            first_name: "Already",
            last_name: "Exists",
            email: "test@example.com"
        })

        const res = await createUser(existingUser, kv) as OpsResult
        assertFalse(res.ok)
    })

    await t.step("Update user", async () => {
        const testEmail = "test@example.com"

        const resGetUserEmail = await getUserByEmail(testEmail,kv) as OpsResult
        if (!resGetUserEmail.ok) throw new Error(JSON.stringify(resGetUserEmail))
        
        const userId = resGetUserEmail.value.id

        const userUpdate = schemas.ZUserUpdate.parse({
            id: userId,
            last_name: "User-update"
        })

        const updateRes = await updateUser(userUpdate, kv)

        
    })

    await t.step("Delete user", async () => {
        const userRes = await getUserByEmail("test@example.com",kv) as OpsResult
        if (!userRes.ok) throw new Error(JSON.stringify(userRes))
        const user = userRes.value as User

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

        const userRes = await createUser(newUser,kv) as OpsResult;
        if (!userRes.ok) throw new Error(JSON.stringify(userRes))
        const user = userRes.value as User

        const testTransactionInput = schemas.ZTransactionCreate.parse({
            date: moment.utc(new Date()).format('YYYY-MM-DD'),
            amount: 100.00,
            currency: "US",
            comment: "test"
        })

        const transactionRes = await createTransaction(user.id,testTransactionInput,kv)
        if (!transactionRes.ok) throw new Error(JSON.stringify(transactionRes))
        const transaction = transactionRes.value as Transaction
        console.debug("transaction",transaction)

        assert(schemas.ZTransaction.safeParse(transaction).success)
    })

    await t.step("User gets transaction by id", async () => {
        const userRes = await getUserByEmail("test@example.com",kv) as OpsResult
        if (!userRes.ok) throw new Error(JSON.stringify(userRes))
        const user = userRes.value as User

        const testTransactionInput = schemas.ZTransactionCreate.parse({
            date: moment.utc(new Date()).format('YYYY-MM-DD'),
            amount: -50.00,
            currency: "US",
            comment: "test"
        })

        const createTransactionRes = await createTransaction(user.id,testTransactionInput,kv)
        if (!createTransactionRes.ok) throw new Error(JSON.stringify(createTransactionRes))
        const testTransaction = createTransactionRes.value as Transaction

        const getTransactionRes = await getTransactionById(user.id, testTransaction.id, kv)
        if (!getTransactionRes.ok) throw new Error(JSON.stringify(getTransactionRes))
        const transaction = getTransactionRes.value as Transaction

        assertEquals(transaction, testTransaction)
    })

    await t.step("User gets list of transactions by date", async () => {
        const userRes = await getUserByEmail("test@example.com",kv) as OpsResult
        if (!userRes.ok) throw new Error(JSON.stringify(userRes))
        const user = userRes.value as User

        const date = moment.utc(new Date()).format('YYYY-MM-DD')

        const res = await getTransactionsByDate(user.id, date, kv)
        if (!res.ok) throw new Error(JSON.stringify(res))
        
        const transactionsList = res.value as Array<Transaction>
        console.debug("transactionsList",transactionsList)
        assertEquals(2, transactionsList.length)

    })

    await t.step("User gets transactions by date range", async () => {
        const userRes = await getUserByEmail("test@example.com",kv) as OpsResult
        if (!userRes.ok) throw new Error(JSON.stringify(userRes))
        const user = userRes.value as User
        
        const startDate = moment.utc(new Date()).subtract(1, 'd').format('YYYY-MM-DD')
        const endDate = moment.utc(new Date()).add(1, 'd').format('YYYY-MM-DD')

        const testTransactionInput = schemas.ZTransactionCreate.parse({
            date: startDate,
            amount: 20.00,
            currency: "US",
            comment: "date range test"
        })

        const createTransactionRes = await createTransaction(user.id,testTransactionInput,kv)
        if (!createTransactionRes.ok) throw new Error(JSON.stringify(createTransactionRes))
        
        const res = await getTransactionsByDateRange(user.id, startDate, endDate, kv) as OpsResult
        if (!res.ok) throw new Error(JSON.stringify(res))

        const transactionsList = res.value as Array<Transaction>
        console.debug("transactionsList",transactionsList)
        assertEquals(3, transactionsList.length)

    })

    await t.step("User updates existing transaction", async () => {
        const userRes = await getUserByEmail("test@example.com",kv) as OpsResult
        if (!userRes.ok) throw new Error(JSON.stringify(userRes))
        const user = userRes.value as User

        const date = moment.utc(new Date()).format('YYYY-MM-DD')

        const transListRes = await getTransactionsByDate(user.id, date, kv)
        if (!transListRes.ok) throw new Error(JSON.stringify(transListRes))
        
        const transactionsList = transListRes.value as Array<Transaction>

        const transactionToUpdate = schemas.ZTransaction.parse(transactionsList.pop())

        const transactionUpdateData = schemas.ZTransactionUpdate.parse({
            id: transactionToUpdate.id,
            amount: 500.25,
            comment: "Updated transaction"
        })

        const transUpdateRes = await updateTransaction(user.id, transactionUpdateData, kv) as OpsResult
        if (!transUpdateRes.ok) throw new Error(JSON.stringify(transUpdateRes))

        const updatedTransaction = transUpdateRes.value as Transaction

        assert(schemas.ZTransaction.safeParse(updatedTransaction).success)
    })

    await t.step("Get all user's transactions", async () => {

        const userRes = await getUserByEmail("test@example.com",kv)
        if (!userRes.ok) throw new Error(JSON.stringify(userRes))
        const user = userRes.value as User

        const transListRes = await getAllTransactions(user.id,kv)
        if (!transListRes.ok) throw new Error(JSON.stringify(transListRes))
        const transactions = transListRes.value as Array<Transaction>
        console.debug("transactions",transactions)

        assertEquals(3,transactions.length)
    })

    await t.step("User deletes existing transaction", async () => {
        const userRes = await getUserByEmail("test@example.com",kv)
        if (!userRes.ok) throw new Error(JSON.stringify(userRes))
        const user = userRes.value as User

        const date = moment.utc(new Date()).format('YYYY-MM-DD')
        const transListRes = await getTransactionsByDate(user.id, date, kv)
        if (!transListRes.ok) throw new Error(JSON.stringify(transListRes))
        const transactions = transListRes.value as Array<Transaction>

        const transactionToDelete = schemas.ZTransaction.parse(transactions.pop())

        const res = await deleteTransaction(user.id, transactionToDelete.id, kv)

        assertEquals(res,undefined)
    })

    kv.close()
})