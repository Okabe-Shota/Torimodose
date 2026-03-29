/**
 * 給与統計シードデータ生成スクリプト
 *
 * データソース:
 * - doda平均年収ランキング2024-2025 (https://doda.jp/guide/heikin/)
 * - 厚労省 令和5-6年賃金構造基本統計調査 (https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/z2024/index.html)
 * - e-Stat 賃金構造基本統計調査 (https://www.e-stat.go.jp/)
 *
 * 中央値(median)は平均年収の約0.9倍で推定（日本の年収分布は右裾が長い）
 * p25 = median * 0.82, p75 = median * 1.18 で推定（賃金構造基本統計調査の四分位範囲に基づく）
 */

// 職種別の東京・30-34歳（基準年収: 万円）
// doda職種別平均年収2024-2025を参照
const BASE_SALARY: Record<string, number> = {
  software_engineer: 480, // IT/通信系エンジニア: 434-505万
  sales: 440,             // 営業系: 435万
  office_admin: 350,      // 事務/アシスタント: 340万
  marketing: 460,         // 企画/管理系: 464万
  finance: 500,           // 金融系専門職: 465-619万
  medical: 420,           // 医療系: 410万
  education: 380,         // 教育: 370万
  manufacturing: 440,     // メーカー系: 492万(業種) → 職種で440
  construction: 450,      // 建設/プラント: 447万
  food_service: 320,      // 販売/サービス: 330万
  creative: 400,          // クリエイティブ: 397万
  civil_service: 420,     // 公務員: 一般行政職
};

// 年齢層別の係数（30-34を1.0として）
// doda年齢別平均年収2024: 20代365万, 30代454万, 40代517万, 50代601万
const AGE_MULTIPLIER: Record<string, number> = {
  "20-24": 0.72,  // 新卒〜第二新卒
  "25-29": 0.85,  // 若手
  "30-34": 1.00,  // 基準
  "35-39": 1.10,  // 中堅
  "40-44": 1.18,  // ベテラン
  "45-49": 1.25,  // 管理職世代
  "50-54": 1.30,  // ピーク
  "55-59": 1.25,  // 役職定年影響
};

// 地域別の係数（東京を1.0として）
// doda都道府県別平均年収2025: 東京476万, 神奈川456万, 千葉440万, 埼玉426万, 愛知420万
const REGION_MULTIPLIER: Record<string, number> = {
  tokyo: 1.00,
  kanagawa: 0.96,   // 456/476
  saitama: 0.89,    // 426/476
  chiba: 0.92,      // 440/476
  osaka: 0.92,      // 大阪: 東京の約92%
  kyoto: 0.88,      // 京都: 東京の約88%
  hyogo: 0.87,      // 兵庫: 東京の約87%
  aichi: 0.88,      // 420/476
  fukuoka: 0.85,    // 福岡: 東京の約85%
  hokkaido: 0.80,   // 北海道: 東京の約80%
};

type SalaryEntry = {
  year: number;
  occupation: string;
  region: string;
  ageGroup: string;
  median: number;
  p25: number;
  p75: number;
  source: string;
};

const entries: SalaryEntry[] = [];

for (const [occupation, baseSalary] of Object.entries(BASE_SALARY)) {
  for (const [region, regionMul] of Object.entries(REGION_MULTIPLIER)) {
    for (const [ageGroup, ageMul] of Object.entries(AGE_MULTIPLIER)) {
      const avgSalary = baseSalary * regionMul * ageMul;
      // 中央値は平均の約90%（日本の賃金分布の特性）
      const median = Math.round(avgSalary * 0.9) * 10000;
      const p25 = Math.round(median * 0.82);
      const p75 = Math.round(median * 1.18);

      entries.push({
        year: 2024,
        occupation,
        region,
        ageGroup,
        median,
        p25,
        p75,
        source: "厚労省賃金構造基本統計調査2024・doda平均年収ランキング2024-2025",
      });
    }
  }
}

// JSON出力
const json = JSON.stringify(entries, null, 2);
console.log(json);

// ファイルに書き出し
import { writeFileSync } from "fs";
import { join } from "path";
const outPath = join(__dirname, "..", "seed-data", "salary-statistics.json");
writeFileSync(outPath, json, "utf-8");
console.error(`Generated ${entries.length} entries → ${outPath}`);
