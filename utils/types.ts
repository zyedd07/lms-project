// src/utils/types.ts

// --- General Utility Types ---
export type GetFilters = {
    limit?: number;
    offset?: number;
};

// --- User Types ---
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

// --- Old Categories (Course Categories) Types ---
// These types are assumed to be for your Course model's categories.
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
    content: string; // Or a more complex type if you have rich content
};

export type CourseContentModule = {
    id?: string; // Optional, for client-side keying
    title: string;
    videoUrl?: string; // The URL to the video content
    description?: string; // A description for this specific content module
    order?: number; // To define the sequence of modules
};

export type CreateCourseServiceParams = {
    name: string;
    description?: string;
    imageUrl?: string;
    categoryId: string; // This categoryId likely refers to your 'Categories' model
    price?: number;
    demoVideoUrl?: string;
    courseType: string; // e.g., 'live' | 'recorded'
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
    createdBy: string; // The ID of the user/admin who created this series
}

export type UpdateTestSeriesServiceParams = {
    name?: string;
    description?: string;
    price?: number;
}

// --- Test Types ---
export type CreateTestServiceParams = {
    testSeriesId: string; // Links to the parent TestSeries
    name: string; // Name of this specific test (e.g., "Chapter 1 Quiz")
    description?: string;
    durationMinutes: number;
    numberOfQuestions: number;
    passMarkPercentage: number;
    createdBy: string; // The ID of the user/admin who created this test
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
    testId: string; // Foreign key to the Test model
    questionText: string;
    options: string[]; // Array of strings for MCQ options
    correctAnswerIndex: number; // 0-based index of the correct option
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
    uploadedBy?: string; // Optional, if you're tracking the uploader (UUID)
    price: number;
}

export type UpdateQuestionBankServiceParams = {
    name?: string;
    description?: string;
    filePath?: string; // Only if you're replacing the file
    fileName?: string; // Only if you're replacing the file
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
    date: string; // Storing date as string
    time: string; // Storing time as string
    imageUrl?: string; // URL for the webinar image, optional
    status?: WebinarStatus; // Use the new status enum, optional for creation (defaults to 'upcoming')
    jitsiRoomName?: string; // Unique name for Jitsi meeting room
    price: number;
};

export type GetAllWebinarServiceParams = {
    status?: WebinarStatus; // Allow filtering by status
};

export type GetWebinarFilters = {
    limit?: number;
    offset?: number;
};

export type CreateBrandCategoryServiceParams = {
    name: string;
    // description field is intentionally absent as per your updated model
}

export type UpdateBrandCategoryServiceParams = {
    name?: string;
    // description field is intentionally absent
}

// --- Company Types ---
export type CreateCompanyServiceParams = {
    name: string;
    website?: string;
    logoUrl?: string;
    address?: string;
}

export type UpdateCompanyServiceParams = {
    name?: string;
    website?: string;
    logoUrl?: string;
    address?: string;
}

// --- Brand Types ---
export type CreateBrandServiceParams = {
    name: string;
    contents?: any[]; // JSON type, typically an array of objects
    brandCategoryId: string; // UUID
    companyId: string;       // UUID
    availability: string; // Updated: Now a string for quantities (e.g., "225ml", "12mcg")
    recommended_by_vets: boolean;
}

export type UpdateBrandServiceParams = {
    name?: string;
    contents?: any[];
    brandCategoryId?: string;
    companyId?: string;
    availability?: string; // Updated: Now a string
    recommended_by_vets?: boolean;
}

export type GetAllBrandServiceParams = GetFilters & {
    id?: string;
    name?: string;
    brandCategoryId?: string;
    companyId?: string;
    recommended_by_vets?: boolean;
    availability?: string; // Updated: Now a string
}