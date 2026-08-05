# WowDailyReport

魔兽世界大秘境分数行情日报。

## 快速开始

### 1. 抓取最新数据

```bash
python3 scripts/fetch_rio_data.py
```

从 Raider.io 抓取数据并追加到 Excel。

### 2. 生成前端 JSON

```bash
python3 scripts/parse_excel.py
```

从 Excel 生成 `data/current.json` 和归档。

### 3. 预览页面

```bash
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080/web/
```

## 跨赛季切换

编辑 `scripts/fetch_rio_data.py` 顶部配置：

```python
SEASON_SLUG = "season-mn-2"                     # 新赛季 slug
EXPANSION_ID = 11                               # 资料片 ID（换资料片时改）
EXCEL_FILE = "大秘境分数行情.xlsx"              # Excel 文件名（跨赛季沿用同一文件名）
```

如果副本轮换或专精有增减，更新 `DUNGEON_MAP` 和 `SPEC_MAP`。同资料片内通常不用改。

## 数据来源

- 专精分数 / 副本层数 / 最高分队伍：Raider.io (World)
- 0.1% / 1% 分数线：Raider.io (CN)
