import json
import logging
from typing import Dict, List, Any

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(levelname)s:%(message)s')

def evaluate_schedule_with_violation_rate(schedule_data: Dict[str, List[Dict]], instructors_data: List[Dict]) -> Dict[str, Any]:
    """
    periodの値が同じ場合のみ衝突チェックを行い、
    periodが隣り合っている(例: 0と1, 1と2, 2と3)なら衝突判定をスキップする評価関数。
    lengthは考慮しない。
    さらに、period0, period1, period2 で空きコマが存在しないか(H6)をチェック。
    """

    ALL_CLASSES = [
        'ME1','IE1','CA1',
        'ME2','IE2','CA2',
        'ME3','IE3','CA3',
        'ME4','IE4','CA4',
        'ME5','IE5','CA5'
    ]

    # ハード制約の違反/チェックカウント
    hard_violations_count = {
        "H1_instructor_conflict": 0,
        "H2_room_conflict": 0,
        "H3_same_course_conflict": 0,
        "H4_exceed_4_times_in_a_day": 0,
        "H5_two_period_continuous": 0,
        "H6_no_empty_in_012": 0    # ★ 新たに追加
    }
    hard_checks_count = {
        "H1_instructor_conflict": 0,
        "H2_room_conflict": 0,
        "H3_same_course_conflict": 0,
        "H4_exceed_4_times_in_a_day": 0,
        "H5_two_period_continuous": 0,
        "H6_no_empty_in_012": 0    # ★ 新たに追加
    }

    # ソフト制約
    soft_violations_count = {
        "S1_instructor_free_day": 0
    }
    soft_checks_count = {
        "S1_instructor_free_day": 0
    }

    # --------------------------------------------
    # 1) ハード制約チェック (H4, H5, H1, H2, H3, H6)
    # --------------------------------------------
    for day_name, classes in schedule_data.items():
        # ---- (H4) 1日に行える授業数は各クラス4回まで ----
        day_class_count = {cls: 0 for cls in ALL_CLASSES}
        for c in classes:
            for t in c.get("Targets", []):
                if t in day_class_count:
                    day_class_count[t] += 1
        for cls_name in ALL_CLASSES:
            hard_checks_count["H4_exceed_4_times_in_a_day"] += 1
            if day_class_count[cls_name] > 4:
                hard_violations_count["H4_exceed_4_times_in_a_day"] += 1

        # ---- (H5) length=4 => 2コマ連続必須(簡易チェック) ----
        for c in classes:
            p = c.get("periods", {}).get("period", 0)
            length = c.get("periods", {}).get("length", 1)
            if length == 4:
                hard_checks_count["H5_two_period_continuous"] += 1
                # 0-basedで3が終端
                if p + 1 > 3:
                    hard_violations_count["H5_two_period_continuous"] += 1

        # ---- (H6) period0,1,2 に空きコマがないか？(ME5, IE5, CA5は除く) ----
        # ここでは「全クラスが period0,1,2 にすべて入っていないと違反」と仮定
        # (要件に応じて修正してください)
        # 1) まず各クラスが day_name の period0,1,2 のうちどれに割り当てられているかを集計
        assigned_periods_by_class = {cls: set() for cls in ALL_CLASSES}
        for c in classes:
            period_val = c.get("periods", {}).get("period", 0)
            tgts = c.get("Targets", [])
            for t in tgts:
                if t in assigned_periods_by_class:
                    assigned_periods_by_class[t].add(period_val)

        # 2) ME5, IE5, CA5 以外で period0,1,2 がすべて埋まっているか確認
        for cls_name in ALL_CLASSES:
            if cls_name in ["ME5","IE5","CA5"]:
                continue  # 除外
            # チェック回数を1増やす
            hard_checks_count["H6_no_empty_in_012"] += 1

            # もし 0,1,2 の全部が assigned_periods_by_class[cls_name] に含まれていなければ違反
            needed_periods = {0,1,2}
            assigned_set = assigned_periods_by_class[cls_name].intersection(needed_periods)
            if assigned_set != needed_periods:
                # 部分的にしか入っていない or 全く入っていない → 違反
                hard_violations_count["H6_no_empty_in_012"] += 1

        # ---- (H1)(H2)(H3) : period が同じ授業同士のみ衝突チェック ----
        instructors_map = {}
        rooms_map = {}
        courses_map = {}

        for c in classes:
            subject = c.get("Subject","")
            targets = c.get("Targets",[])
            instructors = c.get("Instructors",[])
            rooms = c.get("Rooms",[])
            period_val = c.get("periods", {}).get("period", 0)  # 0,1,2,3
            length = c.get("periods", {}).get("length", 1)

            sorted_instructors = tuple(sorted(instructors))
            sorted_targets = tuple(sorted(targets))
            course_key = (subject, sorted_targets)

            this_class = {
                "Subject": subject,
                "Targets": sorted_targets,
                "Instructors": sorted_instructors,
                "Rooms": rooms,
                "period": period_val,
                "length": length
            }

            if period_val not in instructors_map:
                instructors_map[period_val] = {}
            if period_val not in rooms_map:
                rooms_map[period_val] = {}
            if period_val not in courses_map:
                courses_map[period_val] = {}

            # (H1) 教員衝突
            for instr in sorted_instructors:
                hard_checks_count["H1_instructor_conflict"] += 1
                if instr not in instructors_map[period_val]:
                    instructors_map[period_val][instr] = []
                else:
                    # 衝突
                    for exist_class in instructors_map[period_val][instr]:
                        hard_violations_count["H1_instructor_conflict"] += 1
                        logging.debug(f"[H1] {day_name} period={period_val}: 教員 '{instr}' 重複")
                        logging.debug(f"  既存: {exist_class}")
                        logging.debug(f"  新規: {this_class}")
                instructors_map[period_val][instr].append(this_class)

            # (H2) 教室衝突
            for r in rooms:
                hard_checks_count["H2_room_conflict"] += 1
                if r not in rooms_map[period_val]:
                    rooms_map[period_val][r] = []
                else:
                    for exist_class in rooms_map[period_val][r]:
                        hard_violations_count["H2_room_conflict"] += 1
                        logging.debug(f"[H2] {day_name} period={period_val}: 教室 '{r}' 重複")
                        logging.debug(f"  既存: {exist_class}")
                        logging.debug(f"  新規: {this_class}")
                rooms_map[period_val][r].append(this_class)

            # (H3) 同じperiod かつ (subject,targets) が同一
            hard_checks_count["H3_same_course_conflict"] += 1
            if course_key not in courses_map[period_val]:
                courses_map[period_val][course_key] = []
            else:
                for exist_class in courses_map[period_val][course_key]:
                    hard_violations_count["H3_same_course_conflict"] += 1
                    logging.debug(f"[H3] {day_name} period={period_val}: 同一授業衝突")
                    logging.debug(f"  既存: {exist_class}")
                    logging.debug(f"  新規: {this_class}")
            courses_map[period_val][course_key].append(this_class)

    # -----------------------------------------
    # 2) ソフト制約 (S1) 各教員に少なくとも1日の休み
    # -----------------------------------------
    soft_checks_count["S1_instructor_free_day"] = len(instructors_data)
    for instr in instructors_data:
        instr_name = instr["name"]
        free_days_count = 0
        for day_name, classes in schedule_data.items():
            if not any(instr_name in cl.get("Instructors", []) for cl in classes):
                free_days_count += 1
        if free_days_count == 0:
            soft_violations_count["S1_instructor_free_day"] += 1

    # -----------------------------------------
    # 3) 違反率の計算
    # -----------------------------------------
    hard_constraint_rates = {}
    for key in hard_violations_count:
        c = hard_checks_count[key]
        if c > 0:
            hard_constraint_rates[key] = hard_violations_count[key] / c
        else:
            hard_constraint_rates[key] = 0.0

    soft_constraint_rates = {}
    for key in soft_violations_count:
        c = soft_checks_count[key]
        if c > 0:
            soft_constraint_rates[key] = soft_violations_count[key] / c
        else:
            soft_constraint_rates[key] = 0.0

    if len(hard_constraint_rates) > 0:
        overall_hard_rate = sum(hard_constraint_rates.values()) / len(hard_constraint_rates)
    else:
        overall_hard_rate = 0.0

    if len(soft_constraint_rates) > 0:
        overall_soft_rate = sum(soft_constraint_rates.values()) / len(soft_constraint_rates)
    else:
        overall_soft_rate = 0.0

    return {
        "hard_constraint_rates": hard_constraint_rates,
        "soft_constraint_rates": soft_constraint_rates,
        "hard_violation_rate": overall_hard_rate,
        "soft_violation_rate": overall_soft_rate,
        "hard_violations_count": dict(hard_violations_count),
        "hard_checks_count": dict(hard_checks_count),
        "soft_violations_count": dict(soft_violations_count),
        "soft_checks_count": dict(soft_checks_count)
    }
