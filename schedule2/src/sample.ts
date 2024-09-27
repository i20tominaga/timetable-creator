// ジェネリッククラス ArrayIterator<T> の定義
class ArrayIterator<T> {
    private arr: T[]; // T型の配列を格納するプライベートフィールド
    private idx: number = 0; // 現在のインデックスを示すプライベートフィールド

    // コンストラクター
    public constructor(arr: T[]) {
        this.arr = arr; // 配列を初期化
        this.init(); // インデックスを初期化
    }

    // インデックスを初期化するメソッド
    public init() {
        this.idx = 0;
    }

    // 次の要素があるかどうかを判定するメソッド
    public hasNext(): boolean {
        return this.idx < this.arr.length;
    }

    // 現在の要素を参照するメソッド
    public peek(): T {
        return this.arr[this.idx];
    }

    // 次の要素を取得するメソッド
    public next(): T {
        const value: T = this.arr[this.idx]; // 現在の要素を取得
        this.idx++; // インデックスをインクリメント
        return value; // 現在の要素を返す
    }

    // 前の要素を参照するメソッド
    public pre(): T {
        --this.idx; // インデックスをデクリメント
        return this.arr[this.idx]; // 前の要素を返す
    }
}

// クラス Period の定義
class Period {
    public day: number; // 日
    public period: number; // 時限

    // コンストラクター
    public constructor(day: number, period: number) {
        this.day = day;
        this.period = period;
    }

    // 他の Period インスタンスと比較するメソッド
    public compare(t: Period): number {
        // 日と時限を比較し、順序を返す
        if (this.day < t.day) {
            return -1;
        } else if (t.day < this.day) {
            return 1;
        } else if (this.period < t.period) {
            return -1;
        } else if (t.period < this.period) {
            return 1;
        } else {
            return 0;
        }
    }

    // 日と時限をハッシュ値に変換するメソッド
    public getHash(): number {
        return (this.day << 16) | this.period;
    }
}

// クラス Teacher の定義
class Teacher {
    public name: string; // 名前
    private periods: Set<number>; // 担当時限のセット

    // コンストラクター
    public constructor(name: string, periods: Period[]) {
        this.name = name;
        this.periods = new Set<number>(); // 担当時限のセットを初期化

        // periods 配列をセットに変換
        for (const p of periods) {
            this.periods.add(p.getHash()); // 時限をハッシュ値に変換してセットに追加
        }
    }

    // 特定の時限に担当可能かどうかを判定するメソッド
    public isAvailable(p: Period): boolean {
        return this.periods.has(p.getHash()); // 時限がセットに含まれているかを判定して返す
    }
}

// クラス Task の定義
class Task {
    public name: string; // タスク名
    public teachers: Map<string, Teacher>; // 教師のマップ
    public targets: string[]; // ターゲット
    public rooms: string[]; // 教室
    public length: number; // 時間長さ
    public periods: ArrayIterator<Period>; // 時限のイテレータ

    // コンストラクター
    public constructor(name: string, teachers: Teacher[], targets: string[], rooms: string[], length: number, periods: Period[]) {
        this.name = name;
        this.targets = targets;
        this.rooms = rooms;
        this.length = length;
        this.periods = new ArrayIterator<Period>(periods); // 時限のイテレータを初期化

        this.teachers = new Map<string, Teacher>(); // 教師のマップを初期化
        for (const t of teachers) {
            this.teachers.set(t.name, t); // 教師をマップに追加
        }
    }
}

// JSON データをパースしてタスクの配列を取得する関数
function parseTasks(json: string): Task[] {
    // JSON データのインターフェース定義
    interface PeriodJson {
        day: number;
        period: number;
    }

    interface TeacherJson {
        name: string;
        periods: PeriodJson[];
    }

    interface TaskJson {
        name: string;
        teachers: string[];
        targets: string[];
        rooms: string[];
        length: number;
        periods: PeriodJson[];
    }

    interface ScheduleJson {
        teachers: TeacherJson[];
        tasks: TaskJson[];
    }

    // 時限の JSON データから Period オブジェクトの配列を生成する関数
    function getPeriods(arr: PeriodJson[]): Period[] {
        const periods: Period[] = [];
        for (const e of arr) {
            periods.push(new Period(e.day, e.period)); // JSON データから Period オブジェクトを生成して配列に追加
        }
        return periods;
    }

    const schedule: ScheduleJson = JSON.parse(json) as ScheduleJson; // JSON データをパース

    const teacherMap: Map<string, Teacher> = new Map<string, Teacher>(); // 教師のマップを初期化
    for (const teacher of schedule.teachers) {
        teacherMap.set(teacher.name, new Teacher(teacher.name, getPeriods(teacher.periods))); // JSON データから Teacher オブジェクトを生成してマップに追加
    }

    const tasks: Task[] = [];
    for (const task of schedule.tasks) {
        const teachers: Teacher[] = [];
        for (const teacher of task.teachers) {
            const t: Teacher | undefined = teacherMap.get(teacher);
            if (t === undefined) {
                throw 'Error'; // エラー処理: 教師が見つからない場合はエラーをスロー
            } else {
                teachers.push(t); // タスクに教師を追加
            }
        }

        tasks.push(new Task(task.name, teachers, task.targets, task.rooms, task.length, getPeriods(task.periods))); // タスクを配列に追加
    }

    return tasks; // タスクの配列を返す
}

// クラス TaskResult の定義
class TaskResult {
    public task: Task; // タスク
    public period: number; // 時限
    public length: number; // 時間長さ

    // コンストラクター
    public constructor(task: Task, period: number, length: number) {
        this.task = task;
        this.period = period;
        this.length = length;
    }

    // 指定した時限が含まれているかどうかを判定するメソッド
    public hasPeriod(p: number): boolean {
        return p >= this.period && p < this.period + this.length; // 時限の範囲内にあるかを判定して返す
    }
}

// タスクの配列からスケジュールを生成する関数
function getSchedule(tasks: Task[]): TaskResult[][] | null {
    // 内部関数: 再帰的にスケジュールを生成する
    function get(table: TaskResult[][], tasks: ArrayIterator<Task>): TaskResult[][] | null {
        if (tasks.hasNext()) { // タスクが残っている場合
            const task: Task = tasks.next(); // 次のタスクを取得
            task.periods.init(); // タスクの時限のイテレータを初期化

            while (task.periods.hasNext()) { // タスクの時限が残っている場合
                const period: Period = task.periods.next(); // 次の時限を取得

                let conflicts: boolean = false; // 衝突フラグを初期化
                testConflict: for (let p = period.period; p < period.period + task.length; p++) {
                    for (const t of task.teachers) {
                        if (!t[1].isAvailable(new Period(period.day, p))) { // 担当教師がその時限に利用可能かどうかをチェック
                            conflicts = true; // 衝突あり
                            break testConflict; // チェック終了
                        }
                    }

                    for (const task2 of table[period.day]) {
                        if (task2.hasPeriod(p)) { // 他のタスクがその時限を利用しているかどうかをチェック
                            for (const room of task.rooms) {
                                if (task2.task.rooms.includes(room)) { // 同じ教室を利用しているかどうかをチェック
                                    conflicts = true; // 衝突あり
                                    break testConflict; // チェック終了
                                }
                            }

                            for (const teacher of task.teachers) {
                                if (task2.task.teachers.has(teacher[1].name)) { // 同じ教師を利用しているかどうかをチェック
                                    conflicts = true; // 衝突あり
                                    break testConflict; // チェック終了
                                }
                            }

                            for (const target of task.targets) {
                                if (task2.task.targets.includes(target)) { // 同じターゲットを利用しているかどうかをチェック
                                    conflicts = true; // 衝突あり
                                    break testConflict; // チェック終了
                                }
                            }
                        }
                    }
                }

                if (!conflicts) { // 衝突がない場合
                    table[period.day].push(new TaskResult(task, period.period, task.length)) // スケジュールにタスクを追加
                    const rslt: TaskResult[][] | null = get(table, tasks); // 残りのタスクについて再帰的にスケジュールを生成
                    if (rslt !== null) {
                        return rslt; // スケジュールが完了したら返す
                    }

                    table[period.day].pop(); // スケジュールからタスクを削除して次の時限へ
                }
            }

            tasks.pre(); // タスクのイテレータを前に戻す
            return null; // 衝突があった場合は null を返す
        } else { // タスクがなくなった場合
            return table; // スケジュールを返す
        }
    }

    const table: TaskResult[][] = new Array<TaskResult[]>(7); // 週の曜日分のスケジュールテーブルを生成
    for (let i = 0; i < table.length; i++) {
        table[i] = [];
    }

    return get(table, new ArrayIterator<Task>(tasks)); // スケジュールを生成して返す
}

// メイン処理
// JSON データを読み込んでタスクをパース
import * as fs from 'fs';
const tasks: Task[] = parseTasks(fs.readFileSync('/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/schedule 2/assets/schedule.json').toString());
console.log('Tasks:');
console.log(tasks);

// タスクからスケジュールを生成
const rslt: TaskResult[][] | null = getSchedule(tasks);
console.log();
console.log('Result:');
console.log(rslt);

