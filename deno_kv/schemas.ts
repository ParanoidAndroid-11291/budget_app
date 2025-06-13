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
export const ZTransactionsSetTbKey = z.tuple([ZUuid,z.literal("transactions")])
export const ZTransactionsDateTbKey = z.tuple([ZUuid,z.literal("transactionsByDate"),ZDate,ZUuid])
export const ZTransactionsDateSetTbKey = z.tuple([ZUuid,z.literal("transactionsByDate")],ZDate)

export const ZTbOpsKeyEnum = z.enum([
    "UserSingleton",
    "EmailUserSingleton",
    "TransactionSingleton",
    "TransactionDateSingleton",
    "TransactionsSet",
    "TransactionsDateSet"
])

export const ZTbOpsKeys = z.discriminatedUnion("opsKey", [
    z.strictObject({ 
        opsKey: z.literal(ZTbOpsKeyEnum.enum.UserSingleton), 
        tbKey: ZUsersTbKey 
    }),
    z.strictObject({ 
        opsKey: z.literal(ZTbOpsKeyEnum.enum.EmailUserSingleton), 
        tbKey: ZUsersEmailTbKey 
    }),
    z.strictObject({ 
        opsKey: z.literal(ZTbOpsKeyEnum.enum.TransactionSingleton), 
        tbKey: ZTransactionsTbKey 
    }),
    z.strictObject({ 
        opsKey: z.literal(ZTbOpsKeyEnum.enum.TransactionDateSingleton), 
        tbKey: ZTransactionsDateTbKey 
    }),
    z.strictObject({ 
        opsKey: z.literal(ZTbOpsKeyEnum.enum.TransactionsSet), 
        tbKey: ZTransactionsSetTbKey 
    }),
    z.strictObject({ 
        opsKey: z.literal(ZTbOpsKeyEnum.enum.TransactionsDateSet), 
        tbKey: ZTransactionsDateSetTbKey 
    })
])

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


/*
* SCHEMA FACTORY FUNCTIONS 
*/

const GetTbKeyArgs = z.object({
    userId: ZUuid,
    email: ZEmail,
    transactionId: ZUuid,
    date: ZDate
}).partial({ email: true, transactionId: true, date: true })

type GetTbKeyArgs = z.infer<typeof GetTbKeyArgs>
type TbOpsKeyEnum = z.infer<typeof ZTbOpsKeyEnum>
type TbOpsKey = z.infer<typeof ZTbOpsKeys>


const userTbKey = ZDbKeys.enum.Users                            //User table
const userEmailTbKey = ZDbKeys.enum.UsersByEmail                //User by email table
const transactionTbKey = ZDbKeys.enum.Transactions              //Transactions table
const transactionDateTbKey = ZDbKeys.enum.TransactionsByDate    //Transactions by date table

const userSingletonOp = ZTbOpsKeyEnum.enum.UserSingleton                        //Ops key to generate primary key for operations that result in 0 | 1 records
const userEmailSingletonOp = ZTbOpsKeyEnum.enum.EmailUserSingleton              //Ops key to generate secondary key for operations that result in 0 | 1 records
const transactionSingletonOp = ZTbOpsKeyEnum.enum.TransactionSingleton          //Ops key to generate primary key for operations that result in 0 | 1 records
const transactionDateSingletonOp = ZTbOpsKeyEnum.enum.TransactionDateSingleton  //Ops key to generate secondary key for operations that result in 0 | 1 records
const transactionsSetOp = ZTbOpsKeyEnum.enum.TransactionsSet                    //Ops key to generate primary key for operations that result in 0 | many records
const transactionDateSetOp = ZTbOpsKeyEnum.enum.TransactionsDateSet             //Ops key to generate secondary key for operations that result in 0 | many records

/**
 * Returns the appropriate key(s) for the desired operations
 * @param {Array<TbOpsKeyEnum>} opsKey - Array of 1 or more ops keys to retrieve appropriate tb keys
 * @param {GetTbKeyArgs} keyArgs - Object for additional arguments depending on the type of operation needed
 * @returns {TbOpsKey | Array<TbOpsKey> | undefined} - If opsKey contains 1 value, then TbOpsKey will be returned, otherwise an array will be returned.
 * @throws {Error} - Raises an error for: invalid opsKey values, empty opsKey array, and if any required keyArgs are missing, undefined, or mistyped.
 */
export const getTbKey = (
    opsKey: Array<TbOpsKeyEnum>, 
    keyArgs: GetTbKeyArgs
): TbOpsKey | Array<TbOpsKey> | undefined => {
    const args = GetTbKeyArgs.safeParse(keyArgs).success ? keyArgs : (() => {throw new Error("Invalid keyArgs")})
    const { userId, transactionId, date, email } = args as GetTbKeyArgs

    if (opsKey.length > 1) {
        const keysList: Array<TbOpsKey> = []

        opsKey.map((key) => {
            switch (key) {
                case userSingletonOp:
                    keysList.push(ZTbOpsKeys.parse({
                            opsKey: key,
                            tbKey: ZUsersTbKey.parse([userTbKey,userId])
                    }))
                    break
                case userEmailSingletonOp:
                    if (!email) throw new Error(`email required for ${opsKey} tb key`)
                    keysList.push(ZTbOpsKeys.parse({
                        opsKey: key,
                        tbKey: ZUsersEmailTbKey.parse([userEmailTbKey,email])
                    }))
                    break
                case transactionSingletonOp:
                    if (!transactionId) throw new Error(`transactionId required for ${opsKey} tb key`)
                    keysList.push(ZTbOpsKeys.parse({ 
                        opsKey: key, 
                        tbKey: ZTransactionsTbKey.parse([userId,transactionTbKey,transactionId])
                        })
                    )
                    break
                case transactionDateSingletonOp:
                    if (!date || !transactionId) throw new Error(`transactionId and date required for ${opsKey} tb key`)
                    keysList.push(ZTbOpsKeys.parse({
                        opsKey: key,
                        tbKey: ZTransactionsDateTbKey.parse([userId,transactionDateTbKey,date,transactionId])
                        })
                    )
                    break
                case transactionsSetOp:
                    keysList.push(ZTbOpsKeys.parse({ 
                        opsKey: key, 
                        tbKey: ZTransactionsSetTbKey.parse([userId,transactionTbKey])
                        })
                    )
                    break
                case transactionDateSetOp:
                    if (!date) throw new Error(`date required for ${opsKey} tb key`)
                    keysList.push(ZTbOpsKeys.parse({
                        opsKey: key,
                        tbKey: ZTransactionsDateSetTbKey.parse([userId,transactionDateTbKey,date])
                        })
                    )
                    break
                default:
                    () => {throw new Error("Invalid opsKey")}
            }
        })

        return keysList

    } else if (opsKey.length === 1){
        const key = opsKey.pop()
        switch (key) {
            case userSingletonOp:
                return ZTbOpsKeys.parse({
                        opsKey: key,
                        tbKey: ZUsersTbKey.parse([userTbKey,userId])
                })

            case userEmailSingletonOp:
                if (!email) throw new Error(`email required for ${opsKey} tb key`)
                return ZTbOpsKeys.parse({
                    opsKey: key,
                    tbKey: ZUsersEmailTbKey.parse([userEmailTbKey,email])
                })

            case transactionSingletonOp:
                if (!transactionId) throw new Error(`transactionId required for ${opsKey} tb key`)
                return ZTbOpsKeys.parse({ 
                    opsKey: key, 
                    tbKey: ZTransactionsTbKey.parse([userId,transactionTbKey,transactionId])
                })
                
            case transactionDateSingletonOp:
                if (!date || !transactionId) throw new Error(`transactionId and date required for ${opsKey} tb key`)
                return ZTbOpsKeys.parse({
                    opsKey: key,
                    tbKey: ZTransactionsDateTbKey.parse([userId,transactionDateTbKey,date,transactionId])
                })
                
            case transactionsSetOp:
                return ZTbOpsKeys.parse({ 
                    opsKey: key, 
                    tbKey: ZTransactionsSetTbKey.parse([userId,transactionTbKey])
                })

            case transactionDateSetOp:
                if (!date) throw new Error(`date required for ${opsKey} tb key`)
                return ZTbOpsKeys.parse({
                    opsKey: key,
                    tbKey: ZTransactionsDateSetTbKey.parse([userId,transactionDateTbKey,date])
                })

            default:
                () => {throw new Error("Invalid opsKey")}
        }
    } else { throw new Error("must provide at least 1 value in opsKey array") }
}