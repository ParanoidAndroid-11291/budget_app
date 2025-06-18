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
    ZTransactionsDateTbKey,
    ZTransactionsSetTbKey,
    ZTransactionsDateSetTbKey,
    ZTbOpsKeys,
    ZTbOpsKeyEnum,
    getTbKey
} from "../schemas.ts"
import { getUserById } from "./users.ts";

const transactionTbKey = ZDbKeys.enum.Transactions              //Transactions table
const transactionDateTbKey = ZDbKeys.enum.TransactionsByDate    //Transactions by date table

const transactionSingletonOp = ZTbOpsKeyEnum.enum.TransactionSingleton          //Ops key to generate primary key for operations that result in 0 | 1 records
const transactionDateSingletonOp = ZTbOpsKeyEnum.enum.TransactionDateSingleton  //Ops key to generate secondary key for operations that result in 0 | 1 records
const transactionsSetOp = ZTbOpsKeyEnum.enum.TransactionsSet                    //Ops key to generate primary key for operations that result in 0 | many records
const transactionDateSetOp = ZTbOpsKeyEnum.enum.TransactionsDateSet             //Ops key to generate secondary key for operations that result in 0 | many records


/* 
* INFERRED TYPES FROM SCHEMA
*/
type OpsResult = z.infer<typeof ZOpsResult>
type TransactionCreate = z.infer<typeof ZTransactionCreate>
type TransactionUpdate = z.infer<typeof ZTransactionUpdate>
type Transaction = z.infer<typeof ZTransaction>
type User = z.infer<typeof ZUser>
type Date = z.infer<typeof ZDate>
type Uuid = z.infer<typeof ZUuid>
type DbError = z.infer<typeof ZDbError>
type TbOpsKey = z.infer<typeof ZTbOpsKeys>
type TransactionSingletonKey = z.infer<typeof ZTransactionsTbKey>
type TransactionDateSingletonKey = z.infer<typeof ZTransactionsDateTbKey>
type TransactionsSetKey = z.infer<typeof ZTransactionsSetTbKey>
type TransactionsDateSetKey = z.infer<typeof ZTransactionsDateSetTbKey>

/*
* UTILITY FUNCTIONS 
 */

const validateUser = async (userId: Uuid, kv: Deno.Kv): Promise<User | DbError | null> => {
    const getUser = await getUserById(userId,kv) as OpsResult
    if (!getUser.ok) return ZDbError.parse({
        error: getUser.error,
        message: getUser.message
    })

    return getUser.value

}

/* 
*  CRUD OPERATIONS
*/

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

    const tbKeys = getTbKey([transactionSingletonOp,transactionDateSingletonOp],{
        userId, transactionId: newTransaction.id, date: newTransaction.date
    }) as Array<TbOpsKey>

    const primaryKey = tbKeys.find(({ opsKey }) => opsKey === transactionSingletonOp)?.tbKey as TransactionSingletonKey
    const dateKey = tbKeys.find(({ opsKey }) => opsKey === transactionDateSingletonOp)?.tbKey as TransactionDateSingletonKey

    //const primaryKey = ZTransactionsTbKey.parse([userId,transactionTbKey,newTransaction.id])
    //const dateKey = ZTransactionsDateTbKey.parse([userId,transactionDateTbKey,newTransaction.date,newTransaction.id])
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

    const prefixKey = getTbKey([transactionDateSetOp],{ userId, date }) as TbOpsKey
    const prefix = prefixKey.tbKey as TransactionsDateSetKey
    
    const iter = kv.list<Transaction>({ prefix })
    const transactions = []
    for await (const { value } of iter) {
        transactions.push(value)
    }

    return ZOpsResult.parse({
        ok: true,
        value: transactions
    })
}

/** 
 * Operation to return list of transactions for user between start and end dates
 * @param { Uuid } userId - Id of user to retrieve transactions for
 * @param { Date } startDate - Start date to retrieve transactions (inclusive)
 * @param { Date } endDate - End date to retrieve transactions (exclusive)
 * @param { Deno.Kv } kv - Deno KV database connection
 * @returns { OpsResult } - Returns OpsResult with value being the array of transactions if successful
 * */ 
export const getTransactionsByDateRange = async (userId: Uuid, startDate: Date, endDate: Date, kv: Deno.Kv): Promise<OpsResult> => {
    const user = await validateUser(userId, kv)

    if (!user) return ZOpsResult.parse({
        ok: false,
        error: "RECORD_NOT_FOUND",
        message: `No user found for id ${userId}`
    })

    const startKey = getTbKey([transactionDateSetOp], { userId, date: startDate }) as TbOpsKey
    const endKey = getTbKey([transactionDateSetOp], { userId, date: endDate }) as TbOpsKey

    const start = startKey.tbKey as TransactionsDateSetKey
    const end = endKey.tbKey as TransactionsDateSetKey

    const transactions = []
    const iter = kv.list<Transaction>({start, end})

    for await (const { value } of iter) transactions.push(value)

    return ZOpsResult.parse({
        ok: true,
        value: transactions
    })
}

export const getAllTransactions = async (userId: Uuid, kv: Deno.Kv): Promise<OpsResult> => {
    const user = await validateUser(userId, kv)

    if (!user) return ZOpsResult.parse({
        ok: false,
        error: "RECORD_NOT_FOUND",
        message: `No user found for id ${userId}`
    })

    const key = getTbKey([transactionsSetOp],{ userId }) as TbOpsKey
    const opsKey = key.tbKey as TransactionsSetKey

    const iter = kv.list<Transaction>({ prefix: opsKey })
    const transactions = []
    for await (const { value } of iter) transactions.push(value)

    return ZOpsResult.parse({
        ok: true,
        value: transactions
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
        const updatedTransaction = ZTransaction.safeParse({ ...transaction, ...updateData})

        if (!updatedTransaction.success) {
            return ZOpsResult.parse({
                ok: false,
                error: updatedTransaction.error,
                message: "Could not merge updates"
            })
        }

        //check that record hasn't changed since retrieved, if not - set primary and secondary key to updated record
        //if check fails, operation will be retired and try again until successful
        res = await kv.atomic()
            .check({key, versionstamp})
            .set(primaryKey,updatedTransaction.data)
            .set(dateKey,updatedTransaction.data)
            .commit()
        
        if (res.ok) {
            res.value = updatedTransaction.data
            break
        }

    } while(true)

    return res
}

export const deleteTransaction = async (userId: Uuid, transactionId: Uuid, kv: Deno.Kv): Promise<OpsResult | undefined> => {
    const user = await validateUser(userId, kv)

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

    const getPrimaryKey = getTbKey([transactionSingletonOp],{userId, transactionId}) as TbOpsKey
    const primaryKey = getPrimaryKey.tbKey

    let res = ZOpsResult.parse({ ok: false })
    do {
        const transaction = await kv.get<Transaction>(primaryKey)
        if (!transaction.value) return;
        const { date } = transaction.value
        const getDateKey = getTbKey([transactionDateSingletonOp],{ userId, transactionId, date }) as TbOpsKey
        const dateKey = getDateKey.tbKey

        res = await kv.atomic()
            .check(transaction)
            .delete(primaryKey)
            .delete(dateKey)
            .commit();
        
    }while (!res.ok)
}