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

export const ZOpsResult = z.discriminatedUnion("ok", [
    z.object({ ok: z.literal(true), value: z.any(), versionstamp: z.string() }).partial({ value: true, versionstamp: true }),
    z.object({ ok: z.literal(false), error: z.any(), message: z.string() }).partial({ error: true, message: true })
])

export const ZDbError = z.strictObject({
    error: z.any(),
    message: z.string()
})


/*
* Users Validation Schemas 
 */

export const ZUser = z.strictObject({
    id: ZUuid,
    first_name: z.string(),
    last_name: z.string(),
    email: z.email()
}).readonly()

export const ZUserCreate = z.strictObject({
    first_name: z.string(),
    last_name: z.string(),
    email: z.email()
})

export const ZUserUpdate = z.strictObject({
    id: ZUuid,
    first_name: z.string(),
    last_name: z.string(),
    email: z.email()
}).partial({ 
    first_name: true, 
    last_name: true, 
    email: true 
}).required({ id: true })

/*
* Transactions Validation Schemas 
 */

export const ZTransaction = z.strictObject({
    id: ZUuid,
    date: z.iso.date(),
    amount: z.number(),
    currency: ZCurrency,
    comment: z.string()
}).partial({comment: true}).readonly()


export const ZTransactionCreate = z.strictObject({
    date: z.iso.date(),
    amount: z.number(),
    currency: ZCurrency,
    comment: z.string()
}).partial({ comment: true })

export const ZTransactionUpdate = z.strictObject({
    id: ZUuid,
    date: z.iso.date(),
    amount: z.number(),
    currency: ZCurrency,
    comment: z.string()
}).partial({ 
    date: true, 
    amount: true, 
    currency: true, 
    comment: true
}).required({ id: true })






