import { CourseTeacherServiceOperationType } from "./types"

export const Role = {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student',
}

export const CourseTeacherServiceOperation: { ASSIGN: CourseTeacherServiceOperationType, UNASSIGN: CourseTeacherServiceOperationType } = {
    ASSIGN: 'assign',
    UNASSIGN: 'unassign',
}