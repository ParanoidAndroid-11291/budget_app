import { z } from "zod/v4"
import { ulid } from "jsr:@std/ulid";
import { 
    ZDbKeys,
    ZOpsResult,
    ZTransaction, 
    ZTransactionCreate, 
    ZTransactionUpdate,
    ZDate,
    ZUuid,
    ZUser,
    ZDbError,
    ZTransactionsTbKey,
    ZTransactionsDateTbKey
} from "../schemas.ts"
import { getUserById } from "./users.ts";

const transactionTbKey = ZDbKeys.enum.Transactions
const transactionDateTbKey = ZDbKeys.enum.TransactionsByDate

type OpsResult = z.infer<typeof ZOpsResult>
type TransactionCreate = z.infer<typeof ZTransactionCreate>
type TransactionUpdate = z.infer<typeof ZTransactionUpdate>
type Transaction = z.infer<typeof ZTransaction>
type User = z.infer<typeof ZUser>
type Date = z.infer<typeof ZDate>
type Uuid = z.infer<typeof ZUuid>
type DbError = z.infer<typeof ZDbError>

const validateUser = async (userId: Uuid, kv: Deno.Kv): Promise<User | DbError | null> => {
    const getUser = await getUserById(userId,kv)
    if (!getUser.ok) return ZDbError.parse({
        error: getUser.error,
        message: getUser.message
    })

    return getUser.value

}


export const createTransaction = async (userId: Uuid, data: TransactionCreate, kv: Deno.Kv): Promise<OpsResult> => {

    const user = await validateUser(userId, kv)
    const checkData = ZTransactionCreate.safeParse(data)

    if (!user) return ZOpsResult.parse({
        ok: false,
        error: "RECORD_NOT_FOUND",
        message: `No user found for id ${userId}`
    })

    if ("error" in user) {
        return ZOpsResult.parse({
            ok: false,
            error: user.error,
            message: user.message
        })
    }

    if (!checkData.success) {
        return ZOpsResult.parse({
            ok: false,
            error: checkData.error,
            message: "Invalid transaction data"
        })
    }

    const newTransaction = ZTransaction.parse({
        ...data,
        id: ulid()
    })

    const primaryKey = ZTransactionsTbKey.parse([userId,transactionTbKey,newTransaction.id])
    const dateKey = ZTransactionsDateTbKey.parse([userId,transactionDateTbKey,newTransaction.date,newTransaction.id])
    const res = await kv.atomic()
        .check({ key: primaryKey, versionstamp: null })
        .set(primaryKey,newTransaction)
        .set(dateKey,newTransaction)
        .commit()

    const createResult = ZOpsResult.parse(res)

    if (!createResult.ok) return ZOpsResult.parse({
        ...createResult,
        error: "TRANSACTION_CREATE_ERROR",
        message: "Transaction creation failed"
    })

    return ZOpsResult.parse({
        ...createResult,
        value: newTransaction
    })
}

export const getTransactionById = async (userId: Uuid, transactionId: Uuid, kv: Deno.Kv): Promise<OpsResult> => {
    const user = await validateUser(userId, kv)
    const checkTransactionId = ZUuid.safeParse(transactionId)

    if (!user) return ZOpsResult.parse({
        ok: false,
        error: "RECORD_NOT_FOUND",
        message: `No user found for id ${userId}`
    })

    if ("error" in user) {
        return ZOpsResult.parse({
            ok: false,
            error: user.error,
            message: user.message
        })
    }

    if (!checkTransactionId.success) {
        return ZOpsResult.parse({
            ok: false,
            error: checkTransactionId.error,
            message: "Invalid transaction ID"
        })
    }

    const key = ZTransactionsTbKey.parse([userId,transactionTbKey,transactionId])
    const { value, versionstamp} = await kv.get<Transaction>(key)

    return ZOpsResult.parse({
        ok: true,
        value,
        versionstamp
    })
}

export const getTransactionsByDate = async (userId: Uuid, date: Date, kv: Deno.Kv): Promise<OpsResult> => {
    const user = await validateUser(userId, kv)
    const checkDate = ZDate.safeParse(date)

    if (!user) return ZOpsResult.parse({
        ok: false,
        error: "RECORD_NOT_FOUND",
        message: `No user found for id ${userId}`
    })

    if ("error" in user) {
        return ZOpsResult.parse({
            ok: false,
            error: user.error,
            message: user.message
        })
    }

    if (!checkDate.success) {
        return ZOpsResult.parse({
            ok: false,
            error: checkDate.error,
            message: "Invalid date format"
        })
    }
    
    const iter = kv.list<Transaction>({ prefix: [userId,transactionDateTbKey,date] })
    const transactions = []
    for await (const { value } of iter) {
        transactions.push(value)
    }

    return ZOpsResult.parse({
        ok: true,
        value: transactions
    })
}

export const getAllTransactions = async (userId: Uuid, kv: Deno.Kv): Promise<OpsResult> => {
    return ZOpsResult.parse({
        ok: true,
        value: "Not implemented"
    })
}

export const updateTransaction = async (userId: Uuid, updateData: TransactionUpdate, kv: Deno.Kv): Promise<OpsResult> => {
    const user = await validateUser(userId, kv)
    const checkData = ZTransactionUpdate.safeParse(updateData)

    if (!user) return ZOpsResult.parse({
        ok: false,
        error: "RECORD_NOT_FOUND",
        message: `No user found for id ${userId}`
    })

    if ("error" in user) {
        return ZOpsResult.parse({
            ok: false,
            error: user.error,
            message: user.message
        })
    }

    if (!checkData.success) {
        return ZOpsResult.parse({
            ok: false,
            error: checkData.error,
            message: "Invalid data for update"
        })
    }

    const primaryKey = ZTransactionsTbKey.parse([userId,transactionTbKey,updateData.id])
    let res = ZOpsResult.parse({ ok: false })

    do {
        //get and check records exists
        const { key, value, versionstamp } = await kv.get<Transaction>(primaryKey)
        if (!value) {
            return ZOpsResult.parse({
                ok: true,
                value,
                versionstamp
            })
        }
        //get record value, setup secondary key, and merge updates into existing record
        const transaction = value
        const dateKey = ZTransactionsDateTbKey.parse([userId,transactionDateTbKey,transaction.date,transaction.id])
        const updatedTransaction = ZTransaction.parse(Object.assign(transaction,updateData))

        //check that record hasn't changed since retrieved, if not - set primary and secondary key to updated record
        //if check fails, operation will be retired and try again until successful
        res = await kv.atomic()
            .check({key, versionstamp})
            .set(primaryKey,updatedTransaction)
            .set(dateKey,updatedTransaction)
            .commit()
        
        if (res.ok) {
            res.value = updateTransaction
            break
        }

    } while(true)

    return res
}

export const deleteTransaction = async (userId: Uuid, transactionId: Uuid, kv: Deno.Kv) => {}