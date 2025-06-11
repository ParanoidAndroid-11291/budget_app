import { z } from "zod/v4"
import { ulid } from "jsr:@std/ulid";
import { 
    ZDbKeys, 
    ZTransaction, 
    ZTransactionCreate, 
    ZTransactionUpdate,
    ZDate,
    ZDbError,
    ZUuid,
    ZUser,
    ZTransactionsTbKey,
    ZTransactionsDateTbKey
} from "../schemas.ts"
import { getUserById } from "./users.ts";

const transactionTbKey = ZDbKeys.enum.Transactions
const transactionDateTbKey = ZDbKeys.enum.TransactionsByDate

type TransactionCreate = z.infer<typeof ZTransactionCreate>
type Transaction = z.infer<typeof ZTransaction>
type Date = z.infer<typeof ZDate>
type DbError = z.infer<typeof ZDbError>
type Uuid = z.infer<typeof ZUuid>


export const createTransaction = async (userId: Uuid, data: TransactionCreate, kv: Deno.Kv): Promise<Transaction | DbError> => {

    const user = await getUserById(userId, kv)
    const checkUser = ZUser.safeParse(user)
    const checkData = ZTransactionCreate.safeParse(data)

    if (!checkUser.success) {
        return ZDbError.parse({
            error: checkUser.error,
            message: "Invalid user ID"
        })
    }

    if (!checkData.success) {
        return ZDbError.parse({
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

    if (!res.ok) return ZDbError.parse({
        error: "TRANSACTION_CREATE_ERROR",
        message: "Transaction creation failed"
    })

    return newTransaction
}

export const getTransactionById = async (userId: Uuid, transactionId: Uuid, kv: Deno.Kv): Promise<Transaction | DbError | null> => {
    const user = await getUserById(userId, kv)
    const checkUser = ZUser.safeParse(user)
    const checkTransactionId = ZUuid.safeParse(transactionId)

    if (!checkUser.success) {
        return ZDbError.parse({
            error: checkUser.error,
            message: "Invalid user ID"
        })
    }

    if (!checkTransactionId.success) {
        return ZDbError.parse({
            error: checkTransactionId.error,
            message: "Invalid transaction ID"
        })
    }

    const key = ZTransactionsTbKey.parse([userId,transactionTbKey,transactionId])
    return (await kv.get<Transaction>(key)).value
}

export const getTransactionsByDate = async (userId: Uuid, date: Date, kv: Deno.Kv): Promise<Array<Transaction> | DbError> => {
    const user = await getUserById(userId, kv)
    const checkUser = ZUser.safeParse(user)
    const checkDate = ZDate.safeParse(date)

    if (!checkUser.success) {
        return ZDbError.parse({
            error: checkUser.error,
            message: "Invalid user ID"
        })
    }

    if (!checkDate.success) {
        return ZDbError.parse({
            error: checkDate.error,
            message: "Invalid date format"
        })
    }
    
    const iter = kv.list<Transaction>({ prefix: [userId,transactionDateTbKey,date] })
    const transactions = []
    for await (const { value } of iter) {
        transactions.push(value)
    }

    return transactions
}

export const updateTransaction = async () => {}

export const deleteTransaction = async () => {}