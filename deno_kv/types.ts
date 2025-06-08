export enum DbKeys {
    Users = "users",
    UsersByEmail = "usersByEmail",
    Transactions = "transaction"
}

export type Transaction = {
    id: string;
    date: string;
    amount: number;
    currency: string;
    comment: string;
}

export type User = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}