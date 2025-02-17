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

export type CreateCategoriesServiceParams = {
    name: string;
    description?: string;
    imageUrl?: string;
}

export type GetCategorySearchCriteria = {
    name?: string;
    id?: string;
}

export type CreateAdminServiceParams = {
    name: string;
    email: string;
    password: string;
}

export type LoginAdminServiceParams = {
    email: string;
    password: string;
}

export type CreateCourseServiceParams = {
    name: string;
    description?: string;
    imageUrl?: string;
    categoryId: string;
    price?: number;
    demoVideoUrl?: string;
    courseType: string;
}

export interface CreateTestSeriesServiceParams {
    name: string;
    description?: string;
    createdBy: string;
}

export interface UpdateTestSeriesServiceParams {
    name?: string;
    description?: string;
}
export interface CreateQuestionServiceParams {
    testId: string;
    questionText: string;
}
export interface UpdateQuestionServiceParams {
    questionText?: string;
}
  
  export interface CreateOptionServiceParams {
    questionId: string;
    text: string;
    isCorrect: boolean;
}

export interface UpdateOptionServiceParams {
    text?: string;
    isCorrect?: boolean;
}

export type UpdateCourseServiceParams = {
    name?: string;
    description?: string;
    imageUrl?: string;
    categoryId?: string;
    price?: number;
    courseType?: string;
    demoVideoUrl?: string;
    active?: boolean;
}

export type CourseTeacherServiceOperationType = 'assign' | 'unassign';

export type GetTeacherFilterType = {
    name?: string;
    email?: string;
    expertise?: string;
    phone?: string;
    id?: string;
}

export type GetAllCourseServiceParams = {
    categoryId?: string;
    id?: string;
    active?: boolean
    teacherId?: string;
}

export type GetCourseFilters = {
    limit?: number;
    offset?: number;
}