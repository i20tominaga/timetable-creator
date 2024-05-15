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
    public periods: Period[]; // 開催時限の配列

    // コンストラクター
    public constructor(name: string, teachers: Map<string, Teacher>, periods: Period[]) {
        this.name = name;
        this.teachers = teachers;
        this.periods = periods;
    }

    // 特定の時限に開催可能かどうかを判定するメソッド
    public isAvailable(p: Period): boolean {
        // 配列のいずれかの時限が担当教師によって開催可能かどうかを判定
        return this.periods.some(period => {
            for (const [, teacher] of this.teachers) {
                if (teacher.isAvailable(period)) {
                    return true;
                }
            }
            return false;
        });
    }
}

// 関数 generateSchedule の定義
function generateSchedule(tasks: Task[], daysOfWeek: number, periodsPerDay: number): Task[][][] {
    const schedule: Task[][][] = [];

    // 日ごとの時限の空のスケジュールを初期化
    for (let i = 0; i < daysOfWeek; i++) {
        const day: Task[][] = [];
        for (let j = 0; j < periodsPerDay; j++) {
            day.push([]);
        }
        schedule.push(day);
    }

    const iterator = new ArrayIterator(tasks); // タスクのイテレーターを作成

    // タスクをスケジュールに挿入する処理
    while (iterator.hasNext()) {
        const task = iterator.next(); // 次のタスクを取得
        let inserted = false;

        for (let day = 0; day < schedule.length && !inserted; day++) {
            for (let period = 0; period < schedule[day].length && !inserted; period++) {
                const p = new Period(day, period); // 日と時限を表す Period インスタンスを作成

                if (task.isAvailable(p)) {
                    schedule[day][period].push(task); // タスクをスケジュールに挿入
                    inserted = true;
                }
            }
        }

        if (!inserted) {
            iterator.pre(); // タスクを前の位置に戻す
        }
    }

    return schedule;
}

// テストデータの作成
const teacherA = new Teacher('Teacher A', [new Period(0, 0), new Period(1, 0)]);
const teacherB = new Teacher('Teacher B', [new Period(2, 1), new Period(3, 2)]);
const teacherC = new Teacher('Teacher C', [new Period(1, 2), new Period(2, 2)]);

const taskA = new Task('Task A', new Map([['A', teacherA]]), [new Period(0, 0), new Period(1, 0), new Period(2, 0)]);
const taskB = new Task('Task B', new Map([['B', teacherB]]), [new Period(2, 1), new Period(3, 2)]);
const taskC = new Task('Task C', new Map([['C', teacherC]]), [new Period(1, 2), new Period(2, 2)]);

const tasks: Task[] = [taskA, taskB, taskC];
const daysOfWeek = 5; // 週の日数
const periodsPerDay = 8; // 1日の時限数

// スケジュール生成のテスト
const schedule = generateSchedule(tasks, daysOfWeek, periodsPerDay);
console.log(schedule); // 生成されたスケジュールをコンソールに出力
