"""Extract a 50-persona static subset for the Korean live demo (지방소멸대응기금 시나리오).

Run:
    uv run --with datasets --with pyarrow \
        python scripts/extract-personas-ko.py

Sampling strategy:
- Bias toward non-Seoul/Gyeonggi regions (population-decline scenario).
- Stratify across age generations (20s, 30s, 40s, 50s, 60s, 70s+).
- Pull a small allowance from Seoul/Gyeonggi for contrast.
- Output: src/data/personas.ko.json
"""

import ast
import json
import random
import sys
from collections import defaultdict
from pathlib import Path

from datasets import load_from_disk

REPO_ROOT = Path(__file__).resolve().parents[2]
DATASET_PATH = REPO_ROOT / "Nemotron-Personas-Korea"
OUT_PATH = Path(__file__).resolve().parents[1] / "src" / "data" / "personas.ko.json"

# Population-decline focus regions (가중치 높음)
DECLINE_REGIONS = [
    "강원", "경상북", "전라남", "전북", "경상남",
    "충청남", "충청북", "제주", "세종",
]
# Mid-tier metro (둘째 우선순위)
METRO_REGIONS = ["부산", "대구", "대전", "광주", "울산", "인천"]
# Capital area (소량만)
CAPITAL_REGIONS = ["서울", "경기"]

QUOTAS = {
    "decline": 30,   # 인구소멸 위험 지역
    "metro":   12,   # 광역시
    "capital":  8,   # 수도권 (대조군)
}
TOTAL = sum(QUOTAS.values())  # 50

GENERATIONS = [(19, 29), (30, 39), (40, 49), (50, 59), (60, 69), (70, 99)]


def parse_list_field(raw: str) -> list[str]:
    """skills_and_expertise_list / hobbies_and_interests_list are stored as Python-list strings."""
    if not raw:
        return []
    try:
        val = ast.literal_eval(raw)
        if isinstance(val, list):
            return [str(x).strip() for x in val if str(x).strip()]
    except (ValueError, SyntaxError):
        pass
    return []


def generation_label(age: int) -> str:
    if age < 30:
        return "20s"
    if age < 40:
        return "30s"
    if age < 50:
        return "40s"
    if age < 60:
        return "50s"
    if age < 70:
        return "60s"
    return "70s+"


def project(record: dict) -> dict:
    return {
        "id": record["uuid"],
        "persona": record["persona"],
        "age": int(record["age"]),
        "generation": generation_label(int(record["age"])),
        "sex": record["sex"],
        "occupation": record["occupation"],
        "district": record["district"],
        "province": record["province"],
        "education": record["education_level"],
        "professional": record["professional_persona"],
        "hobbies": record["hobbies_and_interests"],
        "skills": parse_list_field(record["skills_and_expertise_list"])[:6],
        "interests": parse_list_field(record["hobbies_and_interests_list"])[:6],
    }


def stratified_pick(pool: list[dict], n: int, seed: int) -> list[dict]:
    """Pick n records spread across generations as evenly as possible."""
    rng = random.Random(seed)
    by_gen: dict[str, list[dict]] = defaultdict(list)
    for r in pool:
        by_gen[generation_label(int(r["age"]))].append(r)
    for bucket in by_gen.values():
        rng.shuffle(bucket)

    picked: list[dict] = []
    gen_keys = [g for g in ["20s", "30s", "40s", "50s", "60s", "70s+"] if by_gen[g]]
    if not gen_keys:
        return []
    i = 0
    while len(picked) < n and any(by_gen[g] for g in gen_keys):
        g = gen_keys[i % len(gen_keys)]
        if by_gen[g]:
            picked.append(by_gen[g].pop())
        i += 1
    return picked[:n]


def main() -> None:
    print(f"Loading dataset from {DATASET_PATH} ...", file=sys.stderr)
    ds = load_from_disk(str(DATASET_PATH))["train"]
    print(f"  loaded: {len(ds):,} personas", file=sys.stderr)

    # Build per-region pools by single linear pass.
    needed = {**{r: 0 for r in DECLINE_REGIONS + METRO_REGIONS + CAPITAL_REGIONS}}
    pools: dict[str, list[dict]] = defaultdict(list)
    cap_per_region = 400  # enough for stratified sampling

    print("Scanning shards ...", file=sys.stderr)
    for i, row in enumerate(ds):
        prov = row["province"]
        if prov in pools and len(pools[prov]) >= cap_per_region:
            continue
        if prov in needed:
            pools[prov].append(row)
        if i % 100000 == 0 and i > 0:
            sizes = {k: len(v) for k, v in pools.items()}
            print(f"  scanned {i:,}; pools={sizes}", file=sys.stderr)
        if all(len(pools[r]) >= cap_per_region for r in (DECLINE_REGIONS + METRO_REGIONS + CAPITAL_REGIONS)):
            break

    def sample_group(regions: list[str], quota: int, seed: int) -> list[dict]:
        merged = [r for region in regions for r in pools.get(region, [])]
        return stratified_pick(merged, quota, seed)

    decline = sample_group(DECLINE_REGIONS, QUOTAS["decline"], seed=42)
    metro = sample_group(METRO_REGIONS, QUOTAS["metro"], seed=43)
    capital = sample_group(CAPITAL_REGIONS, QUOTAS["capital"], seed=44)
    selected = decline + metro + capital

    out = [project(r) for r in selected]

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\nSelected:", file=sys.stderr)
    by_prov: dict[str, int] = defaultdict(int)
    by_gen: dict[str, int] = defaultdict(int)
    for p in out:
        by_prov[p["province"]] += 1
        by_gen[p["generation"]] += 1
    print(f"  by province: {dict(sorted(by_prov.items(), key=lambda x: -x[1]))}", file=sys.stderr)
    print(f"  by generation: {dict(sorted(by_gen.items()))}", file=sys.stderr)
    print(f"\nWrote {len(out)} personas → {OUT_PATH}", file=sys.stderr)


if __name__ == "__main__":
    main()
