# ResultExporter.py

import json
import logging
from typing import Dict, List, Any

def format_constraints_to_json(schedule: Dict[str, List[Dict[str, Any]]]) -> Dict:
    """
    スケジュールをJSON形式に整形。
    """
    formatted_schedule = {
        "id": "スケジュールID",
        "Days": []
    }

    for day, classes in schedule.items():
        day_entry = {
            "Day": day,
            "Classes": classes
        }
        formatted_schedule["Days"].append(day_entry)

    return formatted_schedule

def save_to_file(data: Dict, output_path: str):
    """
    データをJSONファイルに保存。
    """
    try:
        with open(output_path, "w", encoding="utf-8") as file:
            json.dump(data, file, ensure_ascii=False, indent=4)
        logging.info(f"データを保存しました: {output_path}")
    except Exception as e:
        logging.error(f"ファイル保存中にエラーが発生しました: {e}")
