interface Period {
    period: number;
    length: number;
}

interface Class {
    targets: string[];
    periods: {
        period: number,
        length: number
    };
    subject: string;
    teachers: string[];
    rooms: string[];
}

interface Day {
    day: string;
    classes: Class[];
}

interface Data {
    days: Day[];
}

const data: Data = {
    days: [
        {
            day: "Monday",
            classes: [
                {
                    targets: ["ca1", "ca2", "me2"],
                    periods: {
                        period: 0,
                        length: 2
                    },
                    subject: "応用解析",
                    teachers: ["たくお"],
                    rooms: ["演習室"]
                }
            ]
        }
    ]
};

function getDayId(day: string): number {
    const arr = ['Monday', 'Tuesday'];
    return arr.indexOf(day);
}

function getTargetId(target: string): number {
    const arr = ['me', 'ie', 'ca'];
    const a = target.substring(0, 2);
    const b = Number.parseInt(target.substring(2)) - 1;
    return b * 3 + arr.indexOf(a);
}

let table: string[][] = [['1', '2', '3', '4']];
for (let y = 0; y < 3 * 3 * 5; y++) {
    const arr: string[] = [];
    for (let x = 0; x < 4; x++) {
        arr.push('');
    }
    table.push(arr);
}

for (const day of data.days) {
    const dayId = getDayId(day.day);

    for (const cls of day.classes) {
        const x = dayId * 4 + cls.periods.period;

        for (const target of cls.targets) {
            const targetId = getTargetId(target);
            const y = targetId * 3 + 1;

            table[y][x] = cls.subject;
            table[y + 1][x] = cls.rooms.join('・');
            table[y + 2][x] = cls.teachers.join('・');
        }
    }
}

const classes1 = ['me', 'ie', 'ca'];

for (let i = 0; i < table.length; i++) {
    let line = '';  // Initialize line string

    for (const str of table[i]) {
        line += `,${str}`;
    }

    console.log(line);
}
