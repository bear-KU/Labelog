# Labelog

Labelog は研究室メンバー限定のグルメ共有 Web アプリである．食べログのように近隣のお店情報やレビュー・写真を投稿・共有できる．Google アカウントによる仮登録と管理者承認制を採用しており，グループ外からはアクセスできないクローズドなサービスとして運用する．

## 技術スタック

| カテゴリ | 技術 |
| -------- | ------ |
| 言語 | TypeScript |
| フロントエンド | Next.js 16 (App Router) |
| スタイリング | Tailwind CSS v4 |
| UI コンポーネント | shadcn/ui |
| フォーム管理 | React Hook Form |
| 入力検証 | Zod |
| 認証 | Neon Auth(Better Auth) + Google OAuth |
| データベース | Neon |
| ORM・migration | Drizzle ORM・Drizzle Kit |
| 画像ストレージ | Cloudinary |
| テスト | Vitest + Playwright |
| ホスティング | Vercel |
| パッケージ管理 | pnpm |

## 前提条件

- Node.js 24.4.0+
- pnpm 12.16.1+
- Googleアカウント（Neon・Vercel・Cloudinaryの管理用）
- 各サービスのアカウント登録済みであること
  - [Neon](https://neon.com)
  - [Vercel](https://vercel.com)
  - [Cloudinary](https://cloudinary.com)

## セットアップ

1. リポジトリを clone する．

```sh
git clone https://github.com/bear-KU/Labelog.git
```

2. パッケージをインストールする．

```sh
cd Labelog
pnpm install
```

3. .env.local を作成し，環境変数を設定する．

```bash
cp .env.local.example .env.local  # 環境変数を設定
```

`NEON_AUTH_COOKIE_SECRET` には，以下のコマンドなどで生成した文字列を入れる．

```bash
openssl rand -base64 32
```

4. migration を実行する．

```bash
pnpm exec drizzle-kit migrate
```

5. 開発サーバを起動する．

```bash
pnpm dev
```

開発サーバが起動したら [http://localhost:3000](http://localhost:3000) をブラウザで開く．

## 環境変数

### 開発用

| 変数名 | 説明 |
| ------- | ------ |
| DATABASE_URL | アプリ用の DB 接続 URL |
| DATABASE_URL_UNPOOLED | migration 用の DB 接続 URL |
| NEON_AUTH_BASE_URL | Neon Auth の 接続 URL |
| NEON_AUTH_COOKIE_SECRET | 認証 Cookie の署名用シークレット |
| CLOUDINARY_CLOUD_NAME | Cloudinary クラウド ID |
| CLOUDINARY_API_KEY | Cloudinary API キー |
| CLOUDINARY_API_SECRET | Cloudinary API シークレット |

### テスト用

`.env.test.local` に test ブランチの DB・Auth 接続情報と，以下の認証情報を設定する．

| 変数名 | 説明 |
| ------- | ------ |
| TEST_APPROVED_EMAIL | 承認済みテスト用アカウントのメールアドレス |
| TEST_APPROVED_PASSWORD | 承認済みテスト用アカウントのパスワード |
| TEST_PENDING_EMAIL | 未承認テスト用アカウントのメールアドレス |
| TEST_PENDING_PASSWORD | 未承認テスト用アカウントのパスワード |

メールアドレスには，架空の値を使用できる．

- 例: `labelog-approved@example.test`

## ドキュメント

- [Design Doc](docs/DESIGN_DOC.md)
