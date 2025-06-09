import { z } from "zod/v4"

/* 
* Table Keys
*/

enum DbKeysEnum {
    Users = "users",
    UsersByEmail = "usersByEmail",
    Transactions = "transaction"
}

export const DbKeys = z.enum(DbKeysEnum)

/* 
* DB Ops Validation Schemas
*/

export const UserCreate = z.strictObject({
    id: z.optional(z.uuidv7()),
    first_name: z.string(),
    last_name: z.string(),
    email: z.email()
})


/* 
* DB Table Schemas
*/

export const Transaction = z.strictObject({
    id: z.uuidv7(),
    timestamp: z.iso.datetime(),
    amount: z.number(),
    currency: z.enum(["US"]),
    comment: z.string()
})

export const User = z.strictObject({
    id: z.uuidv7(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.email()
})
