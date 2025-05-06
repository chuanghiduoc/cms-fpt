import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cấu hình truy cập hình ảnh từ nhiều domain
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Cho phép sử dụng unoptimized image để hiển thị hình ảnh tải lên
    unoptimized: true,
  },
  // Tăng giới hạn kích thước body của request
  serverExternalPackages: ['sharp', 'pdfjs-dist'],
};

export default nextConfig;
