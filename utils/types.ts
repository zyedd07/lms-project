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

// --- NEW TYPE: Syllabus Section ---
export type SyllabusSection = {
    title: string;
    content: string; // Or a more complex type if you have rich content, like an array of sub-topics
    // You could also add other fields here if your frontend supports them, e.g.,
    // order?: number;
    // videoUrl?: string;
};
// --- END NEW TYPE ---


export type CreateCourseServiceParams = {
    name: string;
    description?: string;
    imageUrl?: string;
    categoryId: string;
    price?: number;
    demoVideoUrl?: string;
    courseType: string;
    active?: boolean; // Added this as it's part of your Course model and can be set on creation
    syllabus?: SyllabusSection[]; // <--- ADDED: Optional array of syllabus sections
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
    syllabus?: SyllabusSection[]; // <--- ADDED: Optional array of syllabus sections
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
