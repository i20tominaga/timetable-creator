from collections import defaultdict
import logging
from typing import List, Dict, Set
from pysat.formula import WCNF
from pysat.examples.rc2 import RC2
from initial_solution_generator import generate_initial_solution

# ログの設定
logging.basicConfig(
    filename='scheduler.log',
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s:%(message)s'
)

__all__ = [
    "get_parttime_instructors",
    "filter_parttime_courses",
    "assign_courses_to_schedule"
]

def get_parttime_instructors(instructors: List[Dict]) -> Set[str]:
    """
    非常勤の先生の名前を抽出する関数。
    """
    parttime_instructors = set()
    for instr in instructors:
        if isinstance(instr, dict):
            if not instr.get("isFullTime", True):
                name = instr.get("name")
                if name:
                    parttime_instructors.add(name)
        else:
            logging.warning(f"期待されたインストラクター情報が辞書ではありません: {instr}")
    logging.debug(f"非常勤の先生: {parttime_instructors}")
    return parttime_instructors

def filter_parttime_courses(courses: List[Dict], parttime_instructors: Set[str]) -> List[Dict]:
    """
    非常勤の先生が担当する授業をフィルタリングする関数。
    """
    parttime_courses = []
    for course in courses:
        instructors = course.get("instructors", [])
        if any(instr in parttime_instructors for instr in instructors):
            parttime_courses.append(course)
    logging.debug(f"非常勤の先生が担当する授業数: {len(parttime_courses)}")
    return parttime_courses

def assign_courses_to_schedule(
    parttime_courses: List[Dict],
    fulltime_courses: List[Dict],
    rooms: List[str],
    days: List[str],
    periods_per_day: int,
    instructors_data: List[Dict],
    rooms_data: List[Dict]
) -> Dict[str, Dict[str, List[Dict]]]:
    """
    授業を時間割に割り当てる関数。
    """
    # 非常勤授業のスケジュールを作成（簡略化）
    parttime_schedule = {day: {period: [] for period in range(1, periods_per_day + 1)} for day in days}

    for course in parttime_courses:
        day = days[0]
        parttime_schedule[day][1].append(course)

    # 常勤の授業をMaxSATでスケジューリング
    scheduled_fulltime = assign_fulltime_courses_with_MaxSAT(
        fulltime_courses=fulltime_courses,
        rooms=rooms,
        days=days,
        periods_per_day=periods_per_day,
        scheduled_parttime=parttime_schedule,
        instructors_data=instructors_data,
        rooms_data=rooms_data
    )

    # 統合されたスケジュール
    final_schedule = {day: {"Classes": []} for day in days}
    for day in days:
        final_schedule[day]["Classes"].extend(parttime_schedule[day][1])  # 非常勤授業
        final_schedule[day]["Classes"].extend(scheduled_fulltime.get(day, []))  # 常勤授業

    return final_schedule
