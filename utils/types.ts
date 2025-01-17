export type CreateUserServiceParams = {
    name: string;
    email: string;
    phone: string;
    password: string;
}

export type LoginUserServiceParams = {
    email: string;
    password: string;
}

export type CreateTeacherServiceParams = {
    name: string;
    email: string;
    password: string;
    expertise: string;
    phone: string;
}

export type LoginTeacherServiceParams = {
    email: string;
    password: string;
}