"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
class ArrayIterator {
    constructor(arr) {
        this.idx = 0;
        this.arr = arr;
        this.init();
    }
    init() {
        this.idx = 0;
    }
    hasNext() {
        return this.idx < this.arr.length;
    }
    peek() {
        return this.arr[this.idx];
    }
    next() {
        const value = this.arr[this.idx];
        this.idx++;
        return value;
    }
    pre() {
        --this.idx;
        return this.arr[this.idx];
    }
}
class Period {
    constructor(day, period) {
        this.day = day;
        this.period = period;
    }
    compare(t) {
        if (this.day < t.day) {
            return -1;
        }
        else if (t.day < this.day) {
            return 1;
        }
        else if (this.period < t.period) {
            return -1;
        }
        else if (t.period < this.period) {
            return 1;
        }
        else {
            return 0;
        }
    }
    // FIXME: Unsafe!
    getHash() {
        return (this.day << 16) | this.period;
    }
}
class Teacher {
    constructor(name, periods) {
        this.name = name;
        this.periods = new Set();
        for (const p of periods) {
            this.periods.add(p.getHash());
        }
    }
    isAvailable(p) {
        return this.periods.has(p.getHash());
    }
}
class Task {
    constructor(name, teachers, targets, rooms, length, periods) {
        this.name = name;
        this.targets = targets;
        this.rooms = rooms;
        this.length = length;
        this.periods = new ArrayIterator(periods);
        this.teachers = new Map();
        for (const t of teachers) {
            this.teachers.set(t.name, t);
        }
    }
}
function parseTasks(json) {
    function getPeriods(arr) {
        const periods = [];
        for (const e of arr) {
            periods.push(new Period(e.day, e.period));
        }
        return periods;
    }
    const schedule = JSON.parse(json);
    const teacherMap = new Map();
    for (const teacher of schedule.teachers) {
        teacherMap.set(teacher.name, new Teacher(teacher.name, getPeriods(teacher.periods)));
    }
    const tasks = [];
    for (const task of schedule.tasks) {
        const teachers = [];
        for (const teacher of task.teachers) {
            const t = teacherMap.get(teacher);
            if (t === undefined) {
                throw 'Error';
            }
            else {
                teachers.push(t);
            }
        }
        tasks.push(new Task(task.name, teachers, task.targets, task.rooms, task.length, getPeriods(task.periods)));
    }
    return tasks;
}
class TaskResult {
    constructor(task, period, length) {
        this.task = task;
        this.period = period;
        this.length = length;
    }
    hasPeriod(p) {
        return p >= this.period && p < this.period + this.length;
    }
}
function getSchedule(tasks) {
    function get(table, tasks) {
        if (tasks.hasNext()) {
            const task = tasks.next();
            task.periods.init();
            while (task.periods.hasNext()) {
                const period = task.periods.next();
                let conflicts = false;
                testConflict: for (let p = period.period; p < period.period + task.length; p++) {
                    for (const t of task.teachers) {
                        if (!t[1].isAvailable(new Period(period.day, p))) {
                            conflicts = true;
                            break testConflict;
                        }
                    }
                    for (const task2 of table[period.day]) {
                        if (task2.hasPeriod(p)) {
                            for (const room of task.rooms) {
                                if (task2.task.rooms.includes(room)) {
                                    conflicts = true;
                                    break testConflict;
                                }
                            }
                            for (const teacher of task.teachers) {
                                if (task2.task.teachers.has(teacher[1].name)) {
                                    conflicts = true;
                                    break testConflict;
                                }
                            }
                            for (const target of task.targets) {
                                if (task2.task.targets.includes(target)) {
                                    conflicts = true;
                                    break testConflict;
                                }
                            }
                        }
                    }
                }
                if (!conflicts) {
                    table[period.day].push(new TaskResult(task, period.period, task.length));
                    const rslt = get(table, tasks);
                    if (rslt !== null) {
                        return rslt;
                    }
                    table[period.day].pop();
                }
            }
            tasks.pre();
            return null;
        }
        else {
            return table;
        }
    }
    const table = new Array(7);
    for (let i = 0; i < table.length; i++) {
        table[i] = [];
    }
    return get(table, new ArrayIterator(tasks));
}
// FIXME: Test!
const fs = __importStar(require("fs"));
const tasks = parseTasks(fs.readFileSync('/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/schedule 2/assets/schedule.json').toString());
console.log('Tasks:');
console.log(tasks);
const rslt = getSchedule(tasks);
console.log();
console.log('Result:');
console.log(rslt);
