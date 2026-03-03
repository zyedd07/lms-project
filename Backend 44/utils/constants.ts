// src/utils/constants.ts

import { CourseTeacherServiceOperationType } from "./types"

export const Role = {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student',
} as const; 


export type RoleValue = typeof Role[keyof typeof Role];


export const CourseTeacherServiceOperation: { ASSIGN: CourseTeacherServiceOperationType, UNASSIGN: CourseTeacherServiceOperationType } = {
    ASSIGN: 'assign',
    UNASSIGN: 'unassign',
}
