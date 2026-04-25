# Labelog

Labelog は研究室メンバー限定のグルメ共有 Web アプリである．食べログのように近隣のお店情報やレビュー・写真を投稿・共有できる．Google アカウントによる仮登録と管理者承認制を採用しており，グループ外からはアクセスできないクローズドなサービスとして運用する．

## 技術スタック

| カテゴリ | 技術 |
|--------|------|
| フロントエンド | Next.js 16 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v4 |
| UI コンポーネント | shadcn/ui |
| フォーム管理 | React Hook Form + Zod |
| 認証 | Firebase Authentication |
| データベース | Cloud Firestore |
| 画像ストレージ | Cloudinary |
| ホスティング | Vercel |
| パッケージ管理 | pnpm |

## 前提条件

- Node.js 20.9+
- pnpm 10+
- Googleアカウント（Firebase・Vercel・Cloudinaryの管理用）
- 各サービスのアカウント登録済みであること
  - [Firebase](https://firebase.google.com)
  - [Vercel](https://vercel.com)
  - [Cloudinary](https://cloudinary.com)

## セットアップ

```bash
git clone https://github.com/bear-KU/Labelog.git
cd labelog
pnpm install
cp .env.local.example .env.local  # 環境変数を設定
pnpm dev
```

開発サーバーが起動したら [http://localhost:3000](http://localhost:3000) をブラウザで開く．

## 環境変数

| 変数名 | 説明 |
|-------|------|
| NEXT_PUBLIC_FIREBASE_API_KEY | Firebase API キー |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN | Firebase 認証ドメイン |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID | Firebase プロジェクト ID |
| NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET | Firebase Storage バケット名 |
| NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | Firebase メッセージング送信者 ID |
| NEXT_PUBLIC_FIREBASE_APP_ID | Firebase アプリ ID |
| NEXT_PUBLIC_FIREBASE_MEASUREMENTID | Firebase Google アナリティクス用（任意） |
| CLOUDINARY_CLOUD_NAME | Cloudinary クラウド ID |
| CLOUDINARY_API_KEY | Cloudinary API キー |
| CLOUDINARY_API_SECRET | Cloudinary API シークレット |

## ドキュメント

- [Design Doc](docs/DESIGN_DOC.md)
