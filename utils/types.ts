import { Request } from 'express';

// --- General Utility Types ---
export type GetFilters = {
    limit?: number;
    offset?: number;
};

// --- User Types ---

// --- Type Definitions for Service Layer ---
export type UpdateHomeContentParams = {
    sliderImages?: string[];
    questionOfTheDay?: object;
    aboutUsText?: string;
    customSections?: object[];
    // Admin will provide an array of names for each "top rated" section
    topRatedCourseNames?: string[];
    topRatedTestNames?: string[];
    topRatedQbankNames?: string[];
};

/**
 * Defines the user data that is encoded into the JWT and attached to authenticated requests.
 * Includes all fields from the registration form.
 */
export interface JwtUserPayload {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    profilePicture?: string | null;
    // --- New fields for the JWT payload ---
    dateOfBirth?: string;
    address?: string;
    rollNo?: string;
    collegeName?: string;
    university?: string;
    country?: string;
}

// Extend the Express Request type to include the 'user' property from the JWT
export interface AuthenticatedRequest extends Request {
    user?: JwtUserPayload;
}

/**
 * Defines the parameters required to create a new user.
 * This should match the data sent from the frontend registration form.
 */
export type CreateUserServiceParams = {
    name: string;
    email: string;
    phone: string;
    password: string;
    // --- New fields for user creation ---
    dateOfBirth: string;
    address: string;
    rollNo: string;
    collegeName: string;
    university: string;
    country: string;
    designation: string; // This will map to the 'role' field in the backend
}

export type LoginUserServiceParams = {
    email: string;
    password: string;
}

/**
 * Defines the parameters for updating a user. All fields are optional.
 */
export type UpdateUserServiceParams = {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    profilePicture?: string;
    // --- New fields that can be updated ---
    dateOfBirth?: string;
    address?: string;
    rollNo?: string;
    collegeName?: string;
    university?: string;
    country?: string;
}

// --- Teacher Types ---
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

export type GetTeacherFilterType = {
    name?: string;
    email?: string;
    expertise?: string;
    phone?: string;
    id?: string;
}

// --- Categories (Course Categories) Types ---
export type CreateCategoriesServiceParams = {
    name: string;
    description?: string;
    imageUrl?: string;
}

export type GetCategorySearchCriteria = {
    name?: string;
    id?: string;
}

// --- Admin Types ---
export type CreateAdminServiceParams = {
    name: string;
    email: string;
    password: string;
}

export type LoginAdminServiceParams = {
    email: string;
    password: string;
}

// --- Course Types ---
export type SyllabusSection = {
    title: string;
    content: string;
};

export type CourseContentModule = {
    id?: string;
    title: string;
    videoUrl?: string;
    description?: string;
    order?: number;
};

export type CreateCourseServiceParams = {
    name: string;
    description?: string;
    imageUrl?: string;
    categoryId: string;
    price?: number;
    demoVideoUrl?: string;
    courseType: string;
    active?: boolean;
    syllabus?: SyllabusSection[];
    contents?: CourseContentModule[];
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
    syllabus?: SyllabusSection[];
    contents?: CourseContentModule[];
}

export type GetAllCourseServiceParams = {
    categoryId?: string;
    id?: string;
    active?: boolean;
    teacherId?: string;
}

export type GetCourseFilters = {
    limit?: number;
    offset?: number;
}

export type CourseTeacherServiceOperationType = 'assign' | 'unassign';


// --- Test Series Types ---
export type CreateTestSeriesServiceParams = {
    name: string;
    description?: string;
    price: number;
    createdBy: string;
}

export type UpdateTestSeriesServiceParams = {
    name?: string;
    description?: string;
    price?: number;
}

// --- Test Types ---
export type CreateTestServiceParams = {
    testSeriesId: string;
    name: string;
    description?: string;
    durationMinutes: number;
    numberOfQuestions: number;
    passMarkPercentage: number;
    createdBy: string;
}

export type UpdateTestServiceParams = {
    name?: string;
    description?: string;
    durationMinutes?: number;
    numberOfQuestions?: number;
    passMarkPercentage?: number;
    testSeriesId?: string;
}

// --- Question Types ---
export type CreateQuestionServiceParams = {
    testId: string;
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
    points: number;
    negativePoints: number;
}

export type UpdateQuestionServiceParams = {
    questionText?: string;
    options?: string[];
    correctAnswerIndex?: number;
    points?: number;
    negativePoints?: number;
}

// --- Question Bank Types ---
export type CreateQuestionBankServiceParams = {
    name: string;
    description?: string;
    filePath: string;
    fileName: string;
    uploadedBy?: string;
    price: number;
}

export type UpdateQuestionBankServiceParams = {
    name?: string;
    description?: string;
    filePath?: string;
    fileName?: string;
    uploadedBy?: string;
    price?: number;
}

export type QuestionBankData = {
    id: string;
    name: string;
    description: string | null;
    filePath: string;
    fileName: string;
    price: number;
    uploadedBy: string | null;
    uploadDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

// --- Webinar Types ---
export enum WebinarStatus {
    UPCOMING = 'upcoming',
    LIVE = 'live',
    RECORDED = 'recorded',
}
export type WebinarInput = {
    title: string;
    speaker: string;
    date: string;
    time: string;
    imageUrl?: string;
    status?: WebinarStatus;
    jitsiRoomName?: string;
    price: number;
};

export type GetAllWebinarServiceParams = {
    status?: WebinarStatus;
};

export type GetWebinarFilters = {
    limit?: number;
    offset?: number;
};

// --- Brand and Company Types ---

export type CreateBrandCategoryServiceParams = {
    name: string;
}

export type UpdateBrandCategoryServiceParams = {
    name?: string;
}

export type CreateCompanyServiceParams = {
    name: string;
}

export type UpdateCompanyServiceParams = {
    name?: string;
}

export type CreateBrandServiceParams = {
    name: string;
    contents?: any[];
    brandCategoryId: string;
    companyId: string;
    availability: string;
    recommended_by_vets: boolean;
}

export type UpdateBrandServiceParams = {
    name?: string;
    contents?: any[];
    brandCategoryId?: string;
    companyId?: string;
    availability?: string;
    recommended_by_vets?: boolean;
}

export type GetAllBrandServiceParams = GetFilters & {
    id?: string;
    name?: string;
    brandCategoryId?: string;
    companyId?: string;
    recommended_by_vets?: boolean;
    availability?: string;
}

// --- Notification Types ---
export type CreateNotificationServiceParams = {
    userId: string;
    type: 'message' | 'file' | 'update' | 'webinar' | 'system';
    text: string;
    link?: string;
};

export type UpdateNotificationServiceParams = {
    type?: 'message' | 'file' | 'update' | 'webinar' | 'system';
    text?: string;
    link?: string;
};
export type CreateBroadcastNotificationParams = Omit<CreateNotificationServiceParams, 'userId'>;

export type CreateArticleParams = {
    imageUrl: string;
    title: string;
    content: string;
    doctorName: string;
    batchYear?: string;
};

export type UpdateArticleParams = {
    imageUrl?: string;
    title?: string;
    content?: string;
    doctorName?: string;
    batchYear?: string;
};

export type CreateDrugCategoryParams = {
    name: string;
};

export type UpdateDrugCategoryParams = {
    name?: string;
};

export type CreateDrugParams = {
    name: string;
    categoryId: string;
    details: object; // e.g., { "Actions": "...", "Dose": "..." }
};

export type UpdateDrugParams = {
    name?: string;
    categoryId?: string;
    details?: object;
};
export type EnrollmentStatus = 'active' | 'completed' | 'dropped';

export type EnrollInCourseServiceParams = {
    userId: string;
    courseId: string;
};

export type UnenrollFromCourseServiceParams = {
    userId: string;
    courseId: string;
};

export type GetUserEnrolledCoursesParams = {
    userId: string;
};

export type UpdateEnrollmentStatusParams = {
    userId: string;
    courseId: string;
    status: EnrollmentStatus;
};
export type EnrollInTestSeriesServiceParams = {
    userId: string;
    testSeriesId: string;
};

export type UnenrollFromTestSeriesServiceParams = {
    userId: string;
    testSeriesId: string;
};

export type GetUserEnrolledTestSeriesParams = {
    userId: string;
};

export type UpdateTestSeriesEnrollmentParams = {
    userId: string;
    testSeriesId: string;
    status: EnrollmentStatus;
};
export type EnrollInQbankServiceParams = {
    userId: string;
    qbankId: string;
};

export type UnenrollFromQbankServiceParams = {
    userId: string;
    qbankId: string;
};

export type GetUserEnrolledQbanksParams = {
    userId: string;
};

export type UpdateQbankEnrollmentParams = {
    userId: string;
    qbankId: string;
    status: EnrollmentStatus;
};


export interface CreateHelpSectionParams {
    title: string;
    content: string;
    order?: number;
}

export interface UpdateHelpSectionParams {
    title?: string;
    content?: string;
    order?: number;
}

export interface CreateTermsSectionParams {
    title: string;
    content: string;
    order?: number;
}

export interface UpdateTermsSectionParams {
    title?: string;
    content?: string;
    order?: number;
}

export type TeacherPermissions = {
    courses?: boolean;
    tests?: boolean;
    qbank?: boolean;
    webinars?: boolean;
    // Add any other page keys here as needed
};

export type UpdateTeacherPermissionsParams = {
    teacherId: string;
    permissions: TeacherPermissions;
};

export type GetTeacherPermissionsParams = {
    teacherId: string;
};