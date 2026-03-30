# Supabase統合 - セットアップガイド

## ステップ 1: Supabaseプロジェクト作成

1. https://supabase.com にアクセス
2. 「Start your project」をクリック
3. Google/GitHub でサインアップ
4. 「Create a new project」をクリック
5. プロジェクト名を入力（例：torimodose）
6. パスワードを設定（安全なもの）
7. リージョン選択：`ap-northeast-1`（東京）推奨
8. 「Create new project」をクリック

⏳ プロジェクト作成完了まで 1-2 分待機

---

## ステップ 2: データベーステーブル作成

Supabaseダッシュボードの左メニューから「SQL Editor」をクリック。

以下のSQLコマンドを順に実行：

### 2-1: users テーブル

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
```

### 2-2: diagnoses テーブル

```sql
CREATE TABLE IF NOT EXISTS diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('quick', 'full')),
  input TEXT NOT NULL,
  result JSONB NOT NULL,
  total_potential_saving INTEGER DEFAULT 0,
  answers JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_diagnoses_user_id ON diagnoses(user_id);
CREATE INDEX idx_diagnoses_created_at ON diagnoses(created_at DESC);
```

### 2-3: salary_statistics テーブル

```sql
CREATE TABLE IF NOT EXISTS salary_statistics (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  occupation TEXT NOT NULL,
  region TEXT NOT NULL,
  age_group TEXT NOT NULL,
  median INTEGER NOT NULL,
  p25 INTEGER NOT NULL,
  p75 INTEGER NOT NULL,
  source TEXT NOT NULL
);

CREATE INDEX idx_salary_stats_key
  ON salary_statistics(occupation, region, age_group);
```

### 2-4: deduction_rules テーブル

```sql
CREATE TABLE IF NOT EXISTS deduction_rules (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('income', 'credit', 'benefit')),
  question_key TEXT NOT NULL UNIQUE,
  condition TEXT NOT NULL,
  formula JSONB NOT NULL,
  legal_basis TEXT NOT NULL,
  max_amount INTEGER,
  description TEXT NOT NULL,
  how_to TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_deduction_rules_category ON deduction_rules(category);
```

### 2-5: Row Level Security（RLS）- 推奨

```sql
-- diagnosesテーブルの行レベルセキュリティを有効化
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の診断のみアクセス可能
CREATE POLICY "users can only see own diagnoses"
  ON diagnoses
  FOR ALL
  USING (user_id = auth.uid());

-- ユーザーは自分の診断のみ削除可能
CREATE POLICY "users can only delete own diagnoses"
  ON diagnoses
  FOR DELETE
  USING (user_id = auth.uid());
```

---

## ステップ 3: 環境変数の設定

### 3-1: DATABASE_URLを取得

Supabaseダッシュボードから：
1. 左メニュー → 「Settings」
2. 「Database」をクリック
3. 「Connection string」の下にある接続文字列をコピー（`postgresql://...` で始まるもの）

**重要**: `[YOUR-PASSWORD]` を実際のパスワード（ステップ1で設定したもの）に置き換える

### 3-2: .env.local を更新

`D:/playground/Torimodose/.env.local` に以下を追加：

```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
ENCRYPTION_KEY=your_existing_encryption_key_here
NEXTAUTH_SECRET=your_existing_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

**例**:
```env
DATABASE_URL=postgresql://postgres.abcdefg12345:SuperSecure123!@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

---

## ステップ 4: ローカルで動作確認

```bash
# 依存パッケージをインストール
npm install
# または
yarn install

# 開発サーバーを起動
npm run dev
# または
yarn dev
```

ブラウザで `http://localhost:3000` を開いて、以下を確認：

1. ✓ ホームページで「プライバシーポリシーを確認する →」リンクが表示されている
2. ✓ `/privacy` ページにアクセス可能
3. ✓ ログインなしで診断フロー完走可能
4. ✓ ログイン後、結果を保存ボタンが機能する

---

## ステップ 5: Vercelにデプロイ

```bash
# リモートリポジトリにpush
git push origin main

# Vercelダッシュボードで自動デプロイが開始
# または
vercel deploy --prod
```

### Vercel環境変数の設定

Vercel ダッシュボード → Settings → Environment Variables で以下を設定：

- `DATABASE_URL`: Supabaseの接続文字列（本番用）
- `ENCRYPTION_KEY`: 既存の暗号化キー
- `NEXTAUTH_SECRET`: 既存のNextAuth秘密鍵
- `NEXTAUTH_URL`: 本番ドメイン（例：`https://torimodose.vercel.app`）

---

## トラブルシューティング

### エラー: `database connection refused`

- **原因**: DATABASE_URLが正しく設定されていない
- **対処**: `[PROJECT_REF]` と `[PASSWORD]` を確認

### エラー: `relation "diagnoses" does not exist`

- **原因**: SQLが実行されていない
- **対処**: Supabase SQL Editorで全SQLを実行したか確認

### エラー: `SSL connection error`

- **原因**: 接続プールの設定が異なる
- **対処**: 接続文字列の末尾に `?sslmode=require` を追加

---

## 動作確認チェックリスト

- [ ] Supabaseプロジェクト作成完了
- [ ] 4テーブル（users, diagnoses, salary_statistics, deduction_rules）が作成されている
- [ ] .env.local に DATABASE_URL が正しく設定されている
- [ ] `npm run dev` でエラーなく起動できる
- [ ] ホームページで診断可能
- [ ] ログイン後、結果を保存ボタンをクリックして保存成功
- [ ] Supabaseダッシュボード → Table Editor で diagnoses にデータが入っているか確認
- [ ] total_potential_saving と answers に値が入っているか確認

---

## データ構造

### diagnoses テーブルの保存データ

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | UUID | 診断ID（自動生成） |
| `user_id` | UUID | ユーザーID |
| `type` | TEXT | 診断種別：`quick` または `full` |
| `input` | TEXT | 暗号化された診断入力データ（年収、年齢等） |
| `result` | JSONB | 診断結果（控除・給付金の詳細） |
| `total_potential_saving` | INTEGER | 年間取り戻せる総額（円） |
| `answers` | JSONB | ユーザーが選択した回答内容 |
| `created_at` | TIMESTAMPTZ | 診断日時 |

### answers の例

```json
{
  "annualIncome": 4000000,
  "answers": {
    "idc_furusato": { "using": true },
    "idc_nisa": { "using": false },
    "idex_basic": { "using": true },
    ...
  }
}
```

---

## セキュリティの推奨事項

1. ✅ **RLS（Row Level Security）を有効化** - 各ユーザーは自分のデータのみアクセス
2. ✅ **ENCRYPTION_KEY を安全に管理** - `.env.local` に含めないこと
3. ✅ **DATABASE_URL は本番環境では Vercel の環境変数で設定** - コードにハードコードしない
4. ✅ **定期的にバックアップ** - Supabaseダッシュボードから「Backups」で確認

---

## サポート

トラブルが発生した場合：
1. Supabase Documentation: https://supabase.com/docs
2. Drizzle ORM Documentation: https://orm.drizzle.team
3. このプロジェクトのログ確認: `npm run dev` の出力メッセージ
