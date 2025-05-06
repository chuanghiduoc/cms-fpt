import { NextResponse, NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    console.log('Bắt đầu tải lên hình ảnh lên Cloudinary');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('Không có tệp tin được tải lên');
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    console.log('Hình ảnh được tải lên:', file.name, file.type, file.size);

    // Kiểm tra xem file có phải là hình ảnh không
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Chuyển đổi File thành mảng byte
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Tạo base64 string
    const base64String = `data:${file.type};base64,${buffer.toString('base64')}`;

    try {
      // Tải lên Cloudinary
      console.log('Đang tải lên Cloudinary...');
      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader.upload(
          base64String,
          {
            folder: 'fpt-cms', // thư mục lưu trữ trên Cloudinary
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              console.error('Lỗi khi tải lên Cloudinary:', error);
              reject(error);
            } else if (result) {
              resolve(result);
            } else {
              reject(new Error('No result returned from Cloudinary'));
            }
          }
        );
      });

      console.log('Đã tải lên Cloudinary thành công:', uploadResult);
      
      return NextResponse.json({ 
        success: true, 
        file: {
          filename: file.name,
          fileUrl: uploadResult.secure_url,
          fileType: file.type,
          fileSize: file.size,
          publicId: uploadResult.public_id
        } 
      });
      
    } catch (cloudinaryError) {
      console.error('Lỗi khi tải lên Cloudinary:', cloudinaryError);
      return NextResponse.json(
        { error: 'Error uploading to Cloudinary', details: JSON.stringify(cloudinaryError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Lỗi tổng quát khi tải lên hình ảnh:', error);
    return NextResponse.json(
      { error: 'Error uploading image', details: JSON.stringify(error) },
      { status: 500 }
    );
  }
} 