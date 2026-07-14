"""
大秘境分数行情 Excel 数据解析脚本

职责：读取 Excel 每日数据 Sheet，解析为 JSON 格式，
      生成 current.json 和按日期归档的副本。

@author ext.ahs.lvxingz1
"""
import json
import os
import sys
from datetime import datetime, date
from pathlib import Path

import openpyxl


# 项目根目录（scripts 的上级目录）
PROJECT_ROOT = Path(__file__).resolve().parent.parent
EXCEL_FILE = PROJECT_ROOT / "大秘境分数行情_至暗之夜S1.xlsx"
DATA_DIR = PROJECT_ROOT / "data"
ARCHIVE_DIR = DATA_DIR / "archive"
CURRENT_FILE = DATA_DIR / "current.json"

# 国家队阵容 Sheet 名称
NATIONAL_TEAM_SHEET = "国家队阵容"

# 副本名称起始列索引（第 20 列，即 Excel 第 21 列，减去表头行偏移后为 20）
DUNGEON_START_COL = 20


def parse_national_team(ws) -> list:
    """
    解析「国家队阵容」Sheet，每行第一列为职责名，后续列为职业名。

    参数:
        ws: openpyxl worksheet 对象（国家队阵容 Sheet）

    返回:
        list: [{ "role": "坦克", "classes": ["熊T"] }, ...]
    """
    lineup = []
    for row in ws.iter_rows(min_row=1, values_only=True):
        if row[0] is None:
            continue
        role = str(row[0]).strip()
        classes = [str(c).strip() for c in row[1:] if c is not None and str(c).strip()]
        if classes:
            lineup.append({"role": role, "classes": classes})
    return lineup


def parse_excel(excel_path: str) -> dict:
    """
    解析 Excel 文件，返回完整的 JSON 数据结构。

    参数:
        excel_path: Excel 文件路径

    返回:
        dict: 包含 meta 和 daily 的完整数据结构
    """
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    ws = wb["每日数据"]

    # 读取表头
    headers = [cell.value for cell in ws[1]]

    # 获取副本名称列表（第 20 列起）
    dungeon_names = headers[DUNGEON_START_COL:]

    daily_list = []

    for row in ws.iter_rows(min_row=2, values_only=True):
        if row[0] is None:
            continue

        # 日期转换：数字 → 字符串
        raw_date = row[0]
        if isinstance(raw_date, (int, float)):
            date_str = str(int(raw_date))
        elif isinstance(raw_date, datetime):
            date_str = raw_date.strftime("%Y%m%d")
        else:
            date_str = str(raw_date)

        # 队伍成员拆分
        team_str = row[7] or ""
        team_list = [m.strip() for m in team_str.split(",") if m.strip()]

        # 副本数据
        dungeons = []
        for i, name in enumerate(dungeon_names):
            col_idx = DUNGEON_START_COL + i
            level = row[col_idx] if col_idx < len(row) else 0
            dungeons.append({
                "name": name,
                "level": int(level) if level is not None else 0
            })

        day_data = {
            "date": date_str,
            "season": row[1],
            "seasonWeek": int(row[2]) if row[2] is not None else 0,
            "weeksRemaining": int(row[3]) if row[3] is not None else 0,
            "rank1": {
                "score": int(row[4]) if row[4] is not None else 0,
                "player": row[5] or "",
                "class": row[6] or "",
                "team": team_list
            },
            "top1Pct": float(row[8]) if row[8] is not None else 0,
            "top01Pct": float(row[9]) if row[9] is not None else 0,
            "iron24": int(row[10]) if row[10] is not None else 0,
            "iron23": int(row[11]) if row[11] is not None else 0,
            "nationalTeamRatio": float(row[12]) if row[12] is not None else 0,
            "nonNationalRatio": float(row[13]) if row[13] is not None else 0,
            "faithSpecs": [
                {"name": row[14] or "", "score": float(row[15]) if row[15] is not None else 0},
                {"name": row[16] or "", "score": float(row[17]) if row[17] is not None else 0},
                {"name": row[18] or "", "score": float(row[19]) if row[19] is not None else 0},
            ],
            "dungeons": dungeons
        }
        daily_list.append(day_data)

    # 解析国家队阵容
    national_team = []
    if NATIONAL_TEAM_SHEET in wb.sheetnames:
        national_team = parse_national_team(wb[NATIONAL_TEAM_SHEET])

    wb.close()

    # 构建 meta
    season = daily_list[0]["season"] if daily_list else ""
    latest_date = daily_list[-1]["date"] if daily_list else ""

    result = {
        "meta": {
            "season": season,
            "generatedAt": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "dataCount": len(daily_list),
            "latestDate": latest_date
        },
        "daily": daily_list,
        "nationalTeam": national_team
    }

    return result


def save_json(data: dict, filepath: Path) -> None:
    """
    将数据保存为 JSON 文件，UTF-8 编码，美化格式。

    参数:
        data: 要保存的数据字典
        filepath: 目标文件路径
    """
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    """主入口：解析 Excel 并生成 JSON 文件。"""
    if not EXCEL_FILE.exists():
        print(f"[错误] Excel 文件不存在: {EXCEL_FILE}")
        sys.exit(1)

    print(f"[开始] 解析 Excel: {EXCEL_FILE}")
    data = parse_excel(str(EXCEL_FILE))
    print(f"[完成] 共解析 {data['meta']['dataCount']} 条数据")

    # 生成 current.json
    save_json(data, CURRENT_FILE)
    print(f"[输出] current.json → {CURRENT_FILE}")

    # 按最新日期归档
    latest_date = data["meta"]["latestDate"]
    if latest_date:
        archive_file = ARCHIVE_DIR / f"{latest_date}.json"
        save_json(data, archive_file)
        print(f"[归档] {latest_date}.json → {archive_file}")

    # 支持命令行参数 --archive YYYYMMDD 归档指定日期之前的数据
    if len(sys.argv) >= 3 and sys.argv[1] == "--archive":
        target_date_str = sys.argv[2]
        try:
            target_date = datetime.strptime(target_date_str, "%Y%m%d").date()
            filtered = [d for d in data["daily"] if _parse_date(d["date"]) <= target_date]
            archive_data = {
                "meta": {**data["meta"], "dataCount": len(filtered), "latestDate": target_date_str},
                "daily": filtered
            }
            archive_file = ARCHIVE_DIR / f"{target_date_str}.json"
            save_json(archive_data, archive_file)
            print(f"[归档] 指定日期 {target_date_str}.json → {archive_file}")
        except ValueError:
            print(f"[错误] 日期格式无效: {target_date_str}，应为 YYYYMMDD")
            sys.exit(1)

    print("[完成] 所有操作已完成")


def _parse_date(date_str: str) -> date:
    """将 YYYYMMDD 字符串解析为 date 对象。"""
    return datetime.strptime(date_str, "%Y%m%d").date()


if __name__ == "__main__":
    main()
