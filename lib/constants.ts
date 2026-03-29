/**
 * 職種・地域のマスタデータ
 * フォームUI、結果表示、シードデータで共通利用する
 * データソース: doda平均年収ランキング2024-2025、厚労省賃金構造基本統計調査
 */

export const OCCUPATIONS = [
  { value: "software_engineer", label: "エンジニア・IT" },
  { value: "sales", label: "営業" },
  { value: "office_admin", label: "事務・管理" },
  { value: "marketing", label: "マーケティング・企画" },
  { value: "finance", label: "金融・保険" },
  { value: "medical", label: "医療・福祉" },
  { value: "education", label: "教育" },
  { value: "manufacturing", label: "製造・メーカー" },
  { value: "construction", label: "建設・不動産" },
  { value: "food_service", label: "飲食・サービス" },
  { value: "creative", label: "クリエイティブ" },
  { value: "civil_service", label: "公務員" },
] as const;

export const REGIONS = [
  { value: "tokyo", label: "東京都" },
  { value: "kanagawa", label: "神奈川県" },
  { value: "saitama", label: "埼玉県" },
  { value: "chiba", label: "千葉県" },
  { value: "osaka", label: "大阪府" },
  { value: "kyoto", label: "京都府" },
  { value: "hyogo", label: "兵庫県" },
  { value: "aichi", label: "愛知県" },
  { value: "fukuoka", label: "福岡県" },
  { value: "hokkaido", label: "北海道" },
] as const;

/** value → label の逆引きマップ */
export const OCCUPATION_LABELS: Record<string, string> = Object.fromEntries(
  OCCUPATIONS.map((o) => [o.value, o.label])
);

export const REGION_LABELS: Record<string, string> = Object.fromEntries(
  REGIONS.map((r) => [r.value, r.label])
);
