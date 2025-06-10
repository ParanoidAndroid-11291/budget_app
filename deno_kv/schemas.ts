import { z } from "zod/v4"

/* 
* Table Keys
*/

enum DbKeysEnum {
    Users = "users",
    UsersByEmail = "usersByEmail",
    Transactions = "transactions"
}

export const ZDbKeys = z.enum(DbKeysEnum)

/* 
* DB Ops Validation Schemas
*/

export const ZUuid = z.string().regex(/[0-7][0-9A-HJKMNP-TV-Z]{25}/gm)
export const ZDatetime = z.iso.datetime()
export const ZEmail = z.email()

export const ZUserCreate = z.strictObject({
    id: z.optional(ZUuid),
    first_name: z.string(),
    last_name: z.string(),
    email: z.email()
})

export const ZDbError = z.strictObject({
    error: z.any(),
    message: z.string()
})


/* 
* DB Table Schemas
*/

export const ZTransaction = z.strictObject({
    id: ZUuid,
    timestamp: z.iso.datetime(),
    amount: z.number(),
    currency: z.enum(["US"]),
    comment: z.string()
})

export const ZUser = z.strictObject({
    id: ZUuid,
    first_name: z.string(),
    last_name: z.string(),
    email: z.email()
})
