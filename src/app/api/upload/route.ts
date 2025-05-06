import { NextResponse, NextRequest } from 'next/server';
import { join } from 'path';
import fs from 'fs';
import mime from 'mime';

export async function POST(req: NextRequest) {
  try {
    console.log('Bắt đầu tải lên tệp tin');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('Không có tệp tin được tải lên');
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    console.log('Tệp tin được tải lên:', file.name, file.type, file.size);

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    console.log('Thư mục tải lên:', uploadDir);
    
    // Đảm bảo thư mục tồn tại
    if (!fs.existsSync(uploadDir)) {
      console.log('Thư mục tải lên chưa tồn tại, tạo mới');
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Đã tạo thư mục tải lên');
    } else {
      console.log('Thư mục tải lên đã tồn tại');
    }
    
    // Create unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExtension = mime.getExtension(file.type) || 'bin';
    const filename = `${uniqueSuffix}.${fileExtension}`;
    const filepath = join(uploadDir, filename);
    console.log('Tên tệp tin đích:', filename);
    console.log('Đường dẫn đầy đủ:', filepath);
    
    try {
      // Write file to disk
      console.log('Bắt đầu đọc dữ liệu tệp tin');
      const buffer = Buffer.from(await file.arrayBuffer());
      console.log('Kích thước buffer:', buffer.length);
      console.log('Bắt đầu ghi tệp tin');
      
      fs.writeFileSync(filepath, buffer);
      console.log('Đã ghi tệp tin thành công');

      // Create file info
      const fileUrl = `/uploads/${filename}`;
      console.log('Đã xử lý tệp tin xong, trả về thông tin:');
      
      const fileInfo = {
        filename: file.name,
        fileUrl,
        fileType: file.type,
        fileSize: file.size,
      };
      
      console.log(fileInfo);
      
      return NextResponse.json({ 
        success: true, 
        file: fileInfo 
      });
      
    } catch (fileError) {
      console.error('Lỗi khi ghi tệp tin:', fileError);
      return NextResponse.json(
        { error: 'Error writing file', details: JSON.stringify(fileError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Lỗi tổng quát khi tải lên tệp tin:', error);
    return NextResponse.json(
      { error: 'Error uploading file', details: JSON.stringify(error) },
      { status: 500 }
    );
  }
} 