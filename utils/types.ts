export type CreateUserServiceParams = {
    name: string;
    email: string;
    phone: string;
    password: string;
}

export type LoginUserServiceParams={
    email: string;
    password: string;
}