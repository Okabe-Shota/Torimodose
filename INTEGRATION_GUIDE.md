# Torimodose: Supabase統合 完全ガイド

## 概要

Torimodoseは以下の3つのステップで診断結果をSupabaseに保存します：

```
ホームページ
  ↓ 診断情報入力（年収・年齢・職種・地域）
概算診断ページ（損失額表示）
  ↓「正確な取り戻し額を診断する」
詳細診断ページ（カテゴリ選択 + Q&A）
  ↓ 回答完了
結果ページ（控除・給付金リスト＋総額表示）
  ↓「結果を保存する」（ログイン画面へ）
マイページ（過去の診断一覧）
```

---

## アーキテクチャの変更

### Before（Neon）
```
package.json: @neondatabase/serverless
lib/db/index.ts: neon() + drizzle-orm/neon-http
```

### After（Supabase）
```
package.json: postgres
lib/db/index.ts: postgres() + drizzle-orm/postgres-js
```

**理由**: Supabase は PostgreSQL ホスティング + Auth + Storage を提供。
ドライバを `neon` → `postgres` に変更することで、Drizzle ORM はそのまま使用可能。

---

## ファイル変更の詳細

### 1. package.json

**削除**:
```json
"@neondatabase/serverless": "^1.0.2"
```

**追加**:
```json
"postgres": "^3.4.4"
```

### 2. lib/db/index.ts

**Before**:
```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

**After**:
```typescript
import { postgres } from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

### 3. lib/db/schema.ts

**diagnoses テーブルに2カラム追加**:
```typescript
export const diagnoses = pgTable("diagnoses", {
  // ... 既存カラム
  totalPotentialSaving: integer("total_potential_saving").default(0),
  answers: jsonb("answers"),
  // ... 既存カラム
});
```

**理由**:
- `totalPotentialSaving`: 診断結果ページで表示される「年間取り戻せる金額」を保存
- `answers`: ユーザーが各質問に選択した回答（後で履歴確認用）

### 4. lib/actions/save-diagnosis.ts

**params 型を拡張**:
```typescript
export async function saveDiagnosis(params: {
  type: "quick" | "full";
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  totalPotentialSaving?: number;  // ← 追加
  answers?: Record<string, unknown>;  // ← 追加
})
```

**DB挿入時**:
```typescript
await db.insert(diagnoses).values({
  userId: session.user.id,
  type: params.type,
  input: encryptedInput,
  result: params.result,
  totalPotentialSaving: params.totalPotentialSaving || 0,  // ← 追加
  answers: params.answers,  // ← 追加
});
```

### 5. app/result/full/page.tsx

**SaveResultButton を実装**:

Before: ログイン画面へのリダイレクトボタン
```tsx
<Button render={<Link href="/auth/signup" />} size="lg">
  結果を保存する（無料アカウント作成）
</Button>
```

After: 実際の保存機能
```tsx
<SaveResultButton
  type="full"
  input={parsedData}
  result={{
    deductions,
    totalPotentialSaving,
    answers: parsedData.answers,
  }}
  isLoggedIn={!!session?.user?.id}
  totalPotentialSaving={totalPotentialSaving}
  answers={parsedData.answers}
/>
```

### 6. components/results/SaveResultButton.tsx

**Props に新パラメータ追加**:
```typescript
type Props = {
  // ... 既存フィールド
  totalPotentialSaving?: number;
  answers?: Record<string, unknown>;
};
```

**handleSave で新パラメータを渡す**:
```typescript
const res = await saveDiagnosis({
  type,
  input,
  result,
  totalPotentialSaving,  // ← 追加
  answers,  // ← 追加
});
```

---

## データフロー図

### 詳細診断フロー

```
1. app/page.tsx (ホーム)
   ↓ QuickInputForm: income, age, occupation, region を入力
   ↓ router.push(/result/quick?income=...&age=...&...)

2. app/result/quick/page.tsx (概算診断)
   ↓ runQuickDiagnosis() で損失額を計算
   ↓ 「正確な診断」ボタン: /diagnosis?income=...&age=... へ

3. app/diagnosis/page.tsx (詳細診断ウィザード)
   ↓ DiagnosisWizard: カテゴリ選択 + 各質問に回答
   ↓ 完了時: router.push(/result/full?data=...)

   data = URLエンコード(JSON.stringify({
     annualIncome: 4000000,
     answers: {
       "idc_furusato": { using: true },
       "idex_basic": { using: false },
       ...
     }
   }))

4. app/result/full/page.tsx (結果表示)
   ↓ runFullDiagnosis() で控除・給付金を評価
   ↓ 計算結果: { deductions[], totalPotentialSaving }
   ↓ SaveResultButton でログイン誘導

5. /auth/signup (認証)
   ↓ ユーザーがメールアドレスで登録

6. saveDiagnosis() Server Action
   ↓ auth() でセッション確認
   ↓ input を暗号化
   ↓ diagnoses テーブルに INSERT
      - input: 暗号化されたJSON
      - result: 控除・給付金の詳細
      - totalPotentialSaving: 年間取り戻せる金額
      - answers: ユーザー回答
```

---

## SQL実行順序

Supabase SQL Editor での実行順序：

1. **users** テーブル作成（外部キーの被参照テーブル）
2. **diagnoses** テーブル作成
3. **salary_statistics** テーブル作成
4. **deduction_rules** テーブル作成
5. RLS ポリシー設定（diagnoses テーブル用）

**理由**: diagnoses が users を参照するため、users を先に作成

---

## 環境変数の設定ガイド

### ローカル（.env.local）

```env
# Supabase接続
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres

# NextAuth
ENCRYPTION_KEY=your-secret-key-min-32-chars
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### 本番（Vercel環境変数）

1. Vercel Dashboard → Settings → Environment Variables
2. 以下を設定：
   - `DATABASE_URL`: Supabase本番接続文字列
   - `ENCRYPTION_KEY`: ローカルと同じ値
   - `NEXTAUTH_SECRET`: ローカルと同じ値
   - `NEXTAUTH_URL`: https://torimodose.vercel.app

**⚠️ 注意**: ENCRYPTION_KEY, NEXTAUTH_SECRET は絶対にコミットしないこと。.env.local は `.gitignore` に含める。

---

## テストチェックリスト

### ローカルテスト（http://localhost:3000）

- [ ] ホームページが正常に表示される
- [ ] 「プライバシーポリシーを確認する →」リンクが機能する
- [ ] `/privacy` ページが表示される
- [ ] ログインなしで診断フロー完走可能
- [ ] 結果表示ページで「結果を保存する」ボタンが表示される
- [ ] ボタンをクリックするとログインページへ遷移
- [ ] メールアドレスでサインアップ可能
- [ ] ログイン後、「結果を保存する」ボタンが「保存中...」表示に変わる
- [ ] 保存完了後、「保存済み」表示に変わる
- [ ] Supabase SQL Editor で diagnoses テーブルを確認
  - [ ] user_id が正しく入っている
  - [ ] total_potential_saving に金額が入っている
  - [ ] answers に回答内容が入っている

### 本番テスト

- [ ] Vercel デプロイが成功
- [ ] https://torimodose.vercel.app で診断フロー動作確認
- [ ] ログイン → 保存 → データ確認（Supabase）

---

## よくある問題

### Q: `relation "diagnoses" does not exist` エラー

A: Supabase SQL Editor で CREATE TABLE を実行したか確認。テーブルが作成されていないため、このエラーが発生します。

### Q: `database connection refused` エラー

A: DATABASE_URL が正しいか確認：
- `[PROJECT_REF]` をコピー＆ペーストしたか
- `[PASSWORD]` を実際のパスワードに置き換えたか
- URL末尾が `.com:6543/postgres` で終わっているか

### Q: RLS ポリシーを有効化した後、ログインしてもデータが見えない

A: `auth.uid()` がセッションから自動的に取得されます。
- NextAuth の session.user.id が UUID 形式か確認
- RLS ポリシー内の条件を確認

### Q: 本番環境で「Not authenticated」エラー

A: Vercel 環境変数が設定されているか確認：
- `DATABASE_URL` が本番用 Supabase の接続文字列か
- `NEXTAUTH_URL` が本番ドメイン（https://...）か
- `NEXTAUTH_SECRET` が設定されているか

---

## 次のステップ（オプション）

### 診断履歴の表示

`app/dashboard/page.tsx` にマイページを実装：
```tsx
const diagnoses = await db
  .select()
  .from(diagnosesTable)
  .where(eq(diagnosesTable.userId, session.user.id))
  .orderBy(desc(diagnosesTable.createdAt));
```

### 診断結果の共有

URL ベースで結果を共有できるようにする：
```
/results/[diagnosisId] → 他のユーザーが読み取り専用で確認可能
```

### バックアップの自動化

Supabase Backups API で定期的にバックアップを取得：
```bash
curl -X POST "https://api.supabase.com/v1/projects/{projectRef}/backups" \
  -H "Authorization: Bearer {accessToken}"
```

---

## リファレンス

- Supabase PostgreSQL: https://supabase.com/docs/guides/database
- Drizzle ORM PostgreSQL: https://orm.drizzle.team/docs/get-started-postgresql
- Next.js Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security
