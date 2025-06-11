import { z } from "zod/v4"

/* 
* Utility Schemas
*/

enum DbKeysEnum {
    Users = "users",
    UsersByEmail = "usersByEmail",
    Transactions = "transactions",
    TransactionsByDate = "transactionsByDate"
}

export const ZDbKeys = z.enum(DbKeysEnum)
export const ZCurrency = z.enum(["US","CA"])

export const ZUuid = z.string().regex(/[0-7][0-9A-HJKMNP-TV-Z]{25}/gm)
export const ZDate = z.iso.date()
export const ZEmail = z.email()

export const ZUsersTbKey = z.tuple([z.literal("users"),ZUuid])
export const ZUsersEmailTbKey = z.tuple([z.literal("usersByEmail"),z.email()])

export const ZTransactionsTbKey = z.tuple([ZUuid,z.literal("transactions"),ZUuid])
export const ZTransactionsDateTbKey = z.tuple([ZUuid,z.literal("transactionsByDate"),ZDate,ZUuid])

/* 
* DB Ops Validation Schemas
*/

export const ZUserCreate = z.strictObject({
    first_name: z.string(),
    last_name: z.string(),
    email: z.email()
})

export const ZTransactionCreate = z.strictObject({
    date: z.iso.date(),
    amount: z.number(),
    currency: ZCurrency,
    comment: z.optional(z.string())
})

export const ZTransactionUpdate = ZTransactionCreate.partial()
export const ZUserUpdate = ZUserCreate.partial()

export const ZDbError = z.strictObject({
    error: z.any(),
    message: z.string()
})


/* 
* DB Table Schemas
*/

export const ZTransaction = z.strictObject({
    id: ZUuid,
    date: z.iso.date(),
    amount: z.number(),
    currency: ZCurrency,
    comment: z.optional(z.string())
})

export const ZUser = z.strictObject({
    id: ZUuid,
    first_name: z.string(),
    last_name: z.string(),
    email: z.email()
})
