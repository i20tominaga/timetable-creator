const gradeGroups = ['ME1', 'IE1', 'CA1', 'ME2', 'IE2', 'CA2', 'ME3', 'IE3', 'CA3', 'ME4', 'IE4', 'CA4', 'ME5', 'IE5', 'CA5'];  //　クラスの定義

const groupIndex = (grade: string) => gradeGroups.indexOf(grade);
// 配列をシャッフルする関数
function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 授業名とtargetsを格納するオブジェクトの多次元配列
const uniqueCourses: { [key: string]: Set<string> } = {};

// 授業名とtargetsを格納する関数
function addUniqueCourse(course: any) {
    if (!uniqueCourses[course.name]) {
        uniqueCourses[course.name] = new Set();
    }
    uniqueCourses[course.name].add(course.targets.join(','));
}

// 同じ授業名でtargetsが異なる場合は新しい授業として扱う
function isUniqueCourse(course: any) {
    if (!uniqueCourses[course.name]) {
        return true;
    }
    return !uniqueCourses[course.name].has(course.targets.join(','));
}

// 授業を追加できるか判断する関数
function addCourseToSchedule(
    course: any,
    period: number,
    scheduleMatrix: string[][],
    useTarget: Set<string>,
    usedCourses: Set<string>
) {
    if (!scheduleMatrix[period - 1]) {
        scheduleMatrix[period - 1] = Array(21).fill(null);
    }

    if (usedCourses.has(course.name)) {
        return false;
    }

    for (const target of course.targets) {
        const colIndex = groupIndex(target);
        if (colIndex === -1) continue;

        for (const item of course.instructors) {
            if (useTarget.has(item)) {
                return false; // コンフリクトがある場合は追加しない
            }
        }

        scheduleMatrix[period - 1][colIndex] = course.instructors.join(', ');

        for (const item of course.instructors) {
            useTarget.add(item);
        }

        usedCourses.add(course.name);
    }

    return true;
}

// データ形式に変換する関数
export function convert(coursesData: any[], instructorsData: any[]) {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const days: any[] = [];
    const gradeGroups: { [key: number]: string[] } = {
        1: ['ME1', 'IE1', 'CA1'],
        2: ['ME2', 'IE2', 'CA2'],
        3: ['ME3', 'IE3', 'CA3'],
        4: ['ME4', 'IE4', 'CA4'],
        5: ['ME5', 'IE5', 'CA5'],
    };

    try {
        const instructorScheduleMatrix: string[][][] = daysOfWeek.map(() => Array.from({ length: 4 }, () => Array(21).fill(null)));
        const roomScheduleMatrix: string[][][] = daysOfWeek.map(() => Array.from({ length: 4 }, () => Array(21).fill(null)));
        const usedInstructors = new Set<string>();
        const usedRooms = new Set<string>();
        const usedCourses = new Set<string>();
        const shuffledCourses = shuffleArray([...coursesData]);

        // 授業を各曜日ごとに割り当てる
        for (let dayIndex = 0; dayIndex < daysOfWeek.length; dayIndex++) {
            const dayOfWeek = daysOfWeek[dayIndex];
            const classes: any[] = [];

            // 各曜日の各クラスに1コマずつ授業を割り当てる
            for (let currentPeriod = 1; currentPeriod <= 4; currentPeriod++) {
                for (const gradeStr in gradeGroups) {
                    const grade = Number(gradeStr);
                    const targetGroups = gradeGroups[grade];

                    for (const target of targetGroups) {
                        for (let j = 0; j < shuffledCourses.length; j++) {
                            const course = shuffledCourses[j];
                            if (course && course.targets && course.targets.includes(target) && isUniqueCourse(course)) {
                                addUniqueCourse(course);

                                const instructorCheck = addCourseToSchedule(course, currentPeriod, instructorScheduleMatrix[dayIndex], usedInstructors, usedCourses);

                                if (instructorCheck) {
                                    classes.push({
                                        Subject: course.name,
                                        Instructors: course.instructors,
                                        Targets: course.targets,
                                        Rooms: course.rooms,
                                        Periods: currentPeriod,
                                        Length: 2
                                    });
                                    break; // 1コマ分の授業を割り当てたら次のクラスに移る
                                }
                            }
                        }
                    }
                }
            }

            days.push({
                Day: dayOfWeek,
                Classes: classes
            });
        }

        return { Days: days };
    } catch (error) {
        console.error('Error converting data:', error);
        return { Days: [] };
    }
}
