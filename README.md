# FPT CMS - Hệ thống Quản lý Nội dung

Dự án sử dụng Next.js, Prisma ORM và PostgreSQL để xây dựng hệ thống quản lý nội dung cho tổ chức.

## Yêu cầu hệ thống

- Node.js 18.0 trở lên
- PostgreSQL 14.0 trở lên
- npm hoặc yarn

## Cài đặt

### 1. Clone dự án

```bash
git clone <repository-url>
cd tuongtacnguoimay
```

### 2. Cài đặt dependencies

```bash
npm install
# hoặc
yarn install
```

### 3. Cấu hình cơ sở dữ liệu

- Cài đặt và khởi động PostgreSQL trên máy tính của bạn
- Tạo cơ sở dữ liệu với tên `fpt_cms_db`

### 4. Cấu hình môi trường

Tạo file `.env` với nội dung sau (điều chỉnh thông tin kết nối PostgreSQL theo cấu hình của bạn):

```
# Cấu hình Prisma và PostgreSQL
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/fpt_cms_db?schema=public"

# Next Auth
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"
```

Tạo file `.env.local` với cấu hình Cloudinary (nếu bạn sử dụng Cloudinary):

```
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name
```

### 5. Migration và Seed dữ liệu

```bash
# Tạo migration
npm run prisma:migrate
# hoặc
yarn prisma:migrate

# Seed dữ liệu mẫu
npm run seed
# hoặc
yarn seed
```

## Chạy dự án

### 1. Khởi động server phát triển

```bash
npm run dev
# hoặc
yarn dev
```

Ứng dụng sẽ khởi chạy tại [http://localhost:3000](http://localhost:3000)

### 2. Các lệnh hữu ích khác

```bash
# Build ứng dụng cho production
npm run build
# hoặc
yarn build

# Khởi chạy ứng dụng đã build
npm run start
# hoặc
yarn start

# Mở Prisma Studio để quản lý dữ liệu
npm run prisma:studio
# hoặc
yarn prisma:studio
```

## Cấu trúc dự án

- `/src/app`: Chứa các route và layout chính của ứng dụng
- `/src/components`: Chứa các thành phần giao diện tái sử dụng
- `/src/lib`: Chứa các thư viện và tiện ích
- `/prisma`: Chứa schema Prisma và migration
- `/public`: Chứa các file tĩnh

## Công nghệ sử dụng

- **Frontend**: Next.js 15, React 19, TailwindCSS 4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL với Prisma ORM
- **Authentication**: NextAuth.js
- **Cloud Storage**: Cloudinary
