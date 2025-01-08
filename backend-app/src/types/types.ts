//授業関連のインターフェース
export interface Period {
    day: number;
    period: number;
}
export interface Course {
    name: string;
    instructors: string[];
    targets: string[];
    rooms: string[];
    periods: Period[];
}

export interface CourseJson {
    Course: Course[];
}

//教員関連のインターフェース
export interface Instructor {
    id: string;
    name: string;
    isFullTime: boolean;
    periods: Period[];
}

export interface InstructorJson {
    Instructor: Instructor[];
}

//教室関連のインターフェース
export interface TimeRange {
    start: number;
    end: number;
}
export interface ManualOverride {
    "isManual": boolean;
    "reason": string;
    "setBy": string;
}
export interface Room {
    name: string;
    unavailable: TimeRange[];
    manualOverride: ManualOverride;
}

export interface RoomJson {
    Room: Room[];
}


//時間割一覧のインターフェース
export interface Timetable {
    name: string;
    courses: string[];
}

export interface TimetableJson {
    Timetable: Timetable[];
}

//時間割のインターフェース
export interface ClassEntry {
    Subject: string;
    Instructors: string[];
    Rooms: string[];
    Targets: string[];
    periods: {
        period: number;
        length: number;
    };
}
export interface ExportJson {
    Days: {
        Day: string;
        Classes: ClassEntry[];
    }[];
}

export interface TimeTable {
    id: string;
    name: string;
    file: string;
}

export interface TimeList {
    TimeTables: TimeTable[];
};

//ユーザーのインターフェース
export interface User {
    id: string;
    name: string;
    password: string;
    useTimetable: string;
    role: string;
    accessLevel: string[];
}
