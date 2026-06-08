import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "public" / "data" / "raw_data.csv"
PARTNERS_PATH = ROOT / "public" / "data" / "partners.csv"
RELATIONSHIPS_PATH = ROOT / "public" / "data" / "partner_relationships.csv"

HEADERS = [
    "partner_id",
    "display_name",
    "entity_type",
    "partner_type",
    "legal_entity",
    "city",
    "coverage_area",
    "platforms",
    "ecommerce_scene",
    "categories",
    "price_range",
    "cooperation_models",
    "typical_fee_range",
    "customer_profile",
    "public_cases",
    "case_verification_status",
    "verification_status",
    "review_count",
    "verified_review_count",
    "risk_level",
    "risk_tag_1",
    "risk_tag_2",
    "risk_tag_3",
    "risk_tags",
    "authenticity_score",
    "fulfillment_score",
    "category_fit_score",
    "conversion_feedback_score",
    "data_transparency_score",
    "risk_control_score",
    "data_completeness_score",
    "overall_score",
    "data_source",
    "visibility",
    "updated_at",
    "notes",
    "Introduction",
]


def make_row(**kwargs):
    row = {field: "" for field in HEADERS}
    row.update(
        {
            "entity_type": "company",
            "partner_type": "MCN机构",
            "city": "未知",
            "coverage_area": "未知",
            "platforms": "未知",
            "ecommerce_scene": "未知",
            "categories": "未知",
            "price_range": "未知",
            "cooperation_models": "未知",
            "typical_fee_range": "未知",
            "customer_profile": "未知",
            "public_cases": "公开资料待补充；当前仅根据 raw_data.csv 中的公司名称和主体信息建档。",
            "case_verification_status": "未核验",
            "verification_status": "未核验",
            "review_count": "0",
            "verified_review_count": "0",
            "risk_level": "medium",
            "risk_tag_1": "信息待补充",
            "risk_tag_2": "公开来源不足",
            "risk_tag_3": "需人工核验",
            "risk_tags": "信息待补充;公开来源不足;需人工核验",
            "authenticity_score": "45",
            "fulfillment_score": "45",
            "category_fit_score": "45",
            "conversion_feedback_score": "40",
            "data_transparency_score": "35",
            "risk_control_score": "50",
            "data_completeness_score": "35",
            "overall_score": "42",
            "data_source": "raw_data.csv;公开资料待补充",
            "visibility": "public",
            "updated_at": "2026-06-05",
            "notes": "资料不足，仅作为待尽调公司主体档案；不得视为已核验合作方。",
            "Introduction": "该档案来自本地 raw_data.csv 的公司主体线索。后续需补充官网、平台主页、公开案例、达人名单、授权链路和品牌反馈。",
        }
    )
    row.update(kwargs)
    return row


partners = [
    make_row(
        partner_id="P001",
        display_name="昆图斯",
        entity_type="person",
        partner_type="主播达人",
        legal_entity="",
        city="上海",
        coverage_area="全国",
        platforms="抖音",
        ecommerce_scene="短视频内容;直播电商",
        categories="健康保健;新消费",
        price_range="100-500",
        cooperation_models="服务费;佣金",
        typical_fee_range="未知",
        customer_profile="健身及新消费人群",
        public_cases="用户补充确认：昆图斯是上海的个人创作者，并签约果核宇宙。公开合作案例、报价、履约和品牌反馈仍需单独核验。",
        case_verification_status="部分核验",
        verification_status="部分核验",
        review_count="1",
        verified_review_count="0",
        risk_level="low",
        risk_tag_1="信息待补充",
        risk_tag_2="签约关系需持续核验",
        risk_tag_3="案例未完全核验",
        risk_tags="信息待补充;签约关系需持续核验;案例未完全核验",
        authenticity_score="75",
        fulfillment_score="70",
        category_fit_score="75",
        conversion_feedback_score="65",
        data_transparency_score="60",
        risk_control_score="70",
        data_completeness_score="65",
        overall_score="69",
        data_source="用户确认;公开资料",
        notes="不要把昆图斯和果核宇宙合并；昆图斯是个人创作者，果核宇宙是签约 MCN/公司。",
        Introduction="昆图斯为个人创作者档案，所在地按用户确认保留为上海。其与果核宇宙的关系以签约创作者关系展示，不能替代公司主体信息。",
    ),
    make_row(
        partner_id="P002",
        display_name="零重力Ralf",
        entity_type="person",
        partner_type="主播达人",
        legal_entity="",
        city="上海",
        coverage_area="全国",
        platforms="抖音",
        ecommerce_scene="短视频带货",
        categories="食品饮料;运动户外;健康保健",
        price_range="100-500",
        cooperation_models="服务费;佣金",
        typical_fee_range="5万-20万",
        customer_profile="健身人群",
        public_cases="公开案例以服务商自述为主",
        case_verification_status="未核验",
        verification_status="未核验",
        review_count="1",
        verified_review_count="1",
        risk_level="low",
        risk_tag_1="信息待补充",
        risk_tag_2="案例主要来自自述",
        risk_tags="信息待补充;案例主要来自自述",
        authenticity_score="100",
        fulfillment_score="90",
        category_fit_score="85",
        conversion_feedback_score="90",
        data_transparency_score="80",
        risk_control_score="90",
        data_completeness_score="70",
        overall_score="89",
        data_source="公开资料",
        notes="示例行，可删除",
    ),
    make_row(
        partner_id="P003",
        display_name="某某私域团长",
        entity_type="person",
        partner_type="私域团长",
        legal_entity="",
        city="广州",
        coverage_area="华南",
        platforms="微信私域",
        ecommerce_scene="私域转化;分销招商",
        categories="食品饮料;母婴;宠物",
        price_range="100-500",
        cooperation_models="佣金;分销",
        typical_fee_range="1万以下",
        customer_profile="宝妈;社区消费人群",
        public_cases="暂无公开案例",
        case_verification_status="无公开案例",
        verification_status="未核验",
        review_count="1",
        verified_review_count="0",
        risk_level="medium",
        risk_tag_1="客户画像不清晰",
        risk_tag_2="成交周期较长",
        risk_tags="客户画像不清晰;成交周期较长",
        authenticity_score="55",
        fulfillment_score="70",
        category_fit_score="65",
        conversion_feedback_score="60",
        data_transparency_score="45",
        risk_control_score="60",
        data_completeness_score="55",
        overall_score="60",
        data_source="品牌方提及",
        visibility="internal",
        notes="示例行，可删除",
    ),
]

ENRICH = {
    "无忧传媒": {
        "city": "北京;杭州",
        "coverage_area": "全国",
        "platforms": "抖音;微信视频号;小红书",
        "ecommerce_scene": "短视频;直播电商;达人经纪",
        "categories": "所有品类",
        "cooperation_models": "品牌内容营销;直播电商;达人合作",
        "customer_profile": "品牌方;电商商家",
        "public_cases": "公开资料显示无忧传媒为综合性 MCN/直播电商相关机构；原始资料提到其双总部、多平台业务、达人矩阵和累计合作品牌。公开信息不等同于已验证合作评价。",
        "case_verification_status": "部分核验",
        "verification_status": "部分核验",
        "risk_level": "low",
        "risk_tag_1": "案例未完全核验",
        "risk_tag_2": "信息待补充",
        "risk_tag_3": "公开资料需复核",
        "risk_tags": "案例未完全核验;信息待补充;公开资料需复核",
        "data_source": "官网;raw_data.csv",
        "overall_score": "70",
        "data_completeness_score": "70",
        "Introduction": "无忧传媒为综合性 MCN/直播电商相关机构档案。合作前仍需核验具体联系人、达人授权、报价与品牌反馈。",
    },
    "畅玩": {
        "city": "福州",
        "coverage_area": "全国",
        "platforms": "抖音",
        "ecommerce_scene": "自媒体营销;MCN运营;KOL孵化",
        "categories": "所有品类",
        "cooperation_models": "内容营销;达人孵化;品牌传播",
        "customer_profile": "内容营销品牌;电商商家",
        "public_cases": "原始资料显示畅玩集团业务涵盖自媒体营销、网站媒体营销、MCN运营及KOL孵化；主页展示案例但缺少品牌方确认。",
        "risk_level": "low",
        "risk_tag_1": "信息待补充",
        "risk_tag_2": "案例未完全核验",
        "risk_tag_3": "公开资料需复核",
        "risk_tags": "信息待补充;案例未完全核验;公开资料需复核",
        "data_source": "官网线索;raw_data.csv",
        "overall_score": "60",
        "data_completeness_score": "55",
        "Introduction": "畅玩为线上内容营销与 MCN/KOL 孵化相关机构档案。需进一步核验服务边界、授权链路和合作反馈。",
    },
    "果核宇宙": {
        "city": "西安",
        "coverage_area": "全国",
        "platforms": "抖音;多平台",
        "ecommerce_scene": "短视频内容;达人孵化;直播电商;商务拓展",
        "categories": "新消费;娱乐;健康保健",
        "cooperation_models": "达人孵化;短视频运营;直播电商;品牌IP服务",
        "customer_profile": "新消费品牌;内容创作者",
        "public_cases": "用户补充确认：昆图斯为果核宇宙签约创作者。公开资料还显示果核宇宙业务涉及达人孵化、短视频内容、新媒体策划、直播电商和商务拓展。",
        "case_verification_status": "部分核验",
        "verification_status": "部分核验",
        "risk_level": "low",
        "risk_tag_1": "签约关系需持续核验",
        "risk_tag_2": "案例未完全核验",
        "risk_tag_3": "信息待补充",
        "risk_tags": "签约关系需持续核验;案例未完全核验;信息待补充",
        "data_source": "用户确认;公开资料;raw_data.csv",
        "overall_score": "68",
        "data_completeness_score": "70",
        "Introduction": "果核宇宙是独立 MCN/公司主体，与昆图斯以签约创作者关系关联展示。不得把公司主体信息写到昆图斯个人档案里。",
    },
}


with RAW_PATH.open("r", encoding="utf-8-sig", newline="") as file:
    raw_rows = list(csv.DictReader(file))

seen = {partner["display_name"] for partner in partners}
company_counter = 1
for raw in raw_rows:
    name = (raw.get("raw_display_name") or "").strip()
    legal_entity = (raw.get("raw_company_name") or "").strip()
    if not name and not legal_entity:
        continue
    if name in seen:
        continue

    risk = (raw.get("risk_clues") or "").strip()
    partner = make_row(
        partner_id=f"P_COMPANY_{company_counter:03d}",
        display_name=name or legal_entity,
        legal_entity=legal_entity or "待核验",
        partner_type=(raw.get("suggested_partner_type") or "").strip() or "MCN机构",
        platforms=(raw.get("suggested_platforms") or "").strip() or "未知",
        categories=(raw.get("suggested_categories") or "").strip() or "未知",
        public_cases=(raw.get("raw_text") or raw.get("public_cases_text") or "").strip()
        or "公开资料待补充；当前仅根据 raw_data.csv 中的公司名称和主体信息建档。",
        risk_tags=risk or "信息待补充;公开来源不足;需人工核验",
        risk_tag_1=risk.split(";")[0] if risk else "信息待补充",
        data_source="raw_data.csv",
        notes=f"来源 raw_id={raw.get('raw_id', '')}；公司主体已建档，仍需人工核验。",
    )
    partner.update(ENRICH.get(name, {}))
    partner["partner_id"] = f"P_COMPANY_{company_counter:03d}"
    partner["display_name"] = name or legal_entity
    partner["legal_entity"] = legal_entity or "待核验"
    partner["notes"] = f"来源 raw_id={raw.get('raw_id', '')}；公司主体已建档，仍需人工核验。"
    partners.append(partner)
    seen.add(name)
    company_counter += 1

with PARTNERS_PATH.open("w", encoding="utf-8-sig", newline="") as file:
    writer = csv.DictWriter(file, fieldnames=HEADERS)
    writer.writeheader()
    writer.writerows(partners)

fruit_core_id = next(
    partner["partner_id"] for partner in partners if partner["display_name"] == "果核宇宙"
)
relationship_headers = [
    "id",
    "partner_id",
    "related_partner_id",
    "related_partner_name",
    "relationship_type",
    "source_type",
    "verification_status",
    "notes",
    "visibility",
]
relationships = [
    {
        "id": "REL_001",
        "partner_id": fruit_core_id,
        "related_partner_id": "P001",
        "related_partner_name": "昆图斯",
        "relationship_type": "签约创作者",
        "source_type": "用户确认;公开资料",
        "verification_status": "部分核验",
        "notes": "用户补充确认：昆图斯是上海的个人创作者，并签约果核宇宙；关系用于展示 MCN/创作者关联，不得合并两者主体。",
        "visibility": "public",
    },
    {
        "id": "REL_002",
        "partner_id": "P001",
        "related_partner_id": fruit_core_id,
        "related_partner_name": "果核宇宙",
        "relationship_type": "签约MCN机构",
        "source_type": "用户确认;公开资料",
        "verification_status": "部分核验",
        "notes": "昆图斯个人档案与果核宇宙公司档案建立双向关联；当前合作报价、商务授权和履约反馈仍需单独核验。",
        "visibility": "public",
    },
]
with RELATIONSHIPS_PATH.open("w", encoding="utf-8-sig", newline="") as file:
    writer = csv.DictWriter(file, fieldnames=relationship_headers)
    writer.writeheader()
    writer.writerows(relationships)

print(f"partners={len(partners)} fruit_core_id={fruit_core_id}")
