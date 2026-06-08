import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PARTNERS_PATH = ROOT / "public" / "data" / "partners.csv"

BUSINESS_FIELDS = [
    "registered_capital",
    "founded_date",
    "legal_representative",
    "business_status",
    "business_info_source",
]

INFO = {
    "无忧传媒": {
        "founded_date": "2020-04-07",
        "business_info_source": "水滴信用：无忧传媒集团有限公司工商信息",
    },
    "畅玩": {
        "founded_date": "2018-08-24",
        "business_info_source": "水滴信用：福建畅玩网络有限公司工商信息",
    },
    "乾派文化": {
        "registered_capital": "500万人民币",
        "founded_date": "2017-08-18",
        "legal_representative": "夏铁林",
        "business_status": "开业",
        "business_info_source": "爱企查：深圳市乾派文化传播有限公司工商信息",
    },
    "古麦嘉禾": {
        "registered_capital": "1000万人民币",
        "founded_date": "2018-03-26",
        "legal_representative": "于海波",
        "business_info_source": "中商情报网高新技术企业名录：青岛古麦嘉禾科技有限公司",
    },
    "华星璀璨": {
        "registered_capital": "1000万人民币",
        "founded_date": "2018-05-09",
        "legal_representative": "骆文军",
        "business_info_source": "BOSS直聘/智联招聘公开工商栏：成都华星璀璨娱乐有限公司",
    },
    "遥望科技": {
        "registered_capital": "杭州遥望网络科技有限公司：8894.1289万人民币；佛山/广东遥望科技集团股份有限公司：约9.44亿人民币",
        "founded_date": "杭州遥望网络科技有限公司：2010-11-24；佛山/广东遥望科技集团股份有限公司：2002-07-25",
        "legal_representative": "谢如栋",
        "business_info_source": "水滴信用/财库/新浪财经公开工商与上市公司信息",
    },
    "三只羊": {
        "registered_capital": "5000万人民币",
        "founded_date": "2022-03-30",
        "legal_representative": "张庆杨",
        "business_info_source": "买购APP/公开百科资料：三只羊（合肥）控股集团有限公司",
    },
    "大禹": {
        "founded_date": "2014年",
        "legal_representative": "旷攀峰",
        "business_info_source": "职友集/公开工商页面：苏州大禹数字文化科技集团有限公司",
    },
    "蜂群": {
        "registered_capital": "2500万人民币",
        "founded_date": "2015-12-03",
        "legal_representative": "马力",
        "business_info_source": "买购APP/职友集：深圳市蜂群文化传播有限公司",
    },
    "蜂群文化": {
        "registered_capital": "2500万人民币",
        "founded_date": "2015-12-03",
        "legal_representative": "马力",
        "business_info_source": "买购APP/职友集：深圳市蜂群文化传播有限公司",
    },
    "果核宇宙": {
        "registered_capital": "100万人民币",
        "founded_date": "2021年",
        "legal_representative": "周凡",
        "business_info_source": "BOSS直聘/高校公开资料：西安果核宇宙文化传媒有限公司",
    },
}

with PARTNERS_PATH.open("r", encoding="utf-8-sig", newline="") as file:
    reader = csv.DictReader(file)
    rows = list(reader)
    fieldnames = list(reader.fieldnames or [])

insert_after = "legal_entity"
for field in reversed(BUSINESS_FIELDS):
    if field not in fieldnames:
        index = fieldnames.index(insert_after) + 1 if insert_after in fieldnames else len(fieldnames)
        fieldnames.insert(index, field)

for row in rows:
    for field in BUSINESS_FIELDS:
        row.setdefault(field, "")
    info = INFO.get(row.get("display_name", ""))
    if info:
        for key, value in info.items():
            row[key] = value
        note = row.get("notes", "")
        suffix = "已补充公开工商基础信息；未补充字段表示公开来源不稳或待人工复核。"
        row["notes"] = f"{note} {suffix}".strip()

with PARTNERS_PATH.open("w", encoding="utf-8-sig", newline="") as file:
    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print("updated", sum(1 for row in rows if row.get("display_name") in INFO), "partners")
