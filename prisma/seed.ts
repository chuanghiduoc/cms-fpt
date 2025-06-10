import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create departments
  const engineering = await prisma.department.upsert({
    where: { name: 'Phòng Kỹ thuật' },
    update: {},
    create: {
      name: 'Phòng Kỹ thuật',
      description: 'Phòng kỹ thuật và phát triển phần mềm'
    }
  });

  const marketing = await prisma.department.upsert({
    where: { name: 'Phòng Marketing' },
    update: {},
    create: {
      name: 'Phòng Marketing',
      description: 'Phòng Marketing và PR'
    }
  });

  const hr = await prisma.department.upsert({
    where: { name: 'Phòng Nhân sự' },
    update: {},
    create: {
      name: 'Phòng Nhân sự',
      description: 'Phòng quản lý nhân sự'
    }
  });

  const finance = await prisma.department.upsert({
    where: { name: 'Phòng Tài chính' },
    update: {},
    create: {
      name: 'Phòng Tài chính',
      description: 'Phòng quản lý tài chính và kế toán'
    }
  });

  // Additional departments
  const sales = await prisma.department.upsert({
    where: { name: 'Phòng Kinh doanh' },
    update: {},
    create: {
      name: 'Phòng Kinh doanh',
      description: 'Phòng quản lý kinh doanh và bán hàng'
    }
  });

  const customerService = await prisma.department.upsert({
    where: { name: 'Phòng Chăm sóc Khách hàng' },
    update: {},
    create: {
      name: 'Phòng Chăm sóc Khách hàng',
      description: 'Phòng hỗ trợ và chăm sóc khách hàng'
    }
  });

  const qa = await prisma.department.upsert({
    where: { name: 'Phòng Kiểm soát Chất lượng' },
    update: {},
    create: {
      name: 'Phòng Kiểm soát Chất lượng',
      description: 'Phòng kiểm soát chất lượng sản phẩm và dịch vụ'
    }
  });

  const productDevelopment = await prisma.department.upsert({
    where: { name: 'Phòng Phát triển Sản phẩm' },
    update: {},
    create: {
      name: 'Phòng Phát triển Sản phẩm',
      description: 'Phòng nghiên cứu và phát triển sản phẩm mới'
    }
  });

  const legal = await prisma.department.upsert({
    where: { name: 'Phòng Pháp chế' },
    update: {},
    create: {
      name: 'Phòng Pháp chế',
      description: 'Phòng tư vấn pháp lý và tuân thủ'
    }
  });

  const administration = await prisma.department.upsert({
    where: { name: 'Phòng Hành chính' },
    update: {},
    create: {
      name: 'Phòng Hành chính',
      description: 'Phòng quản lý hành chính và tổng hợp'
    }
  });

  // Create users
  const adminPassword = await hash('Admin@123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@fpt.com.vn' },
    update: {},
    create: {
      name: 'Quản trị viên',
      email: 'admin@fpt.com.vn',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  // Department Heads
  const engineeringHeadPassword = await hash('TruongPhong@123', 10);
  const engineeringHead = await prisma.user.upsert({
    where: { email: 'truongkythuat@fpt.com.vn' },
    update: {},
    create: {
      name: 'Trưởng Phòng Kỹ thuật',
      email: 'truongkythuat@fpt.com.vn',
      password: engineeringHeadPassword,
      role: 'DEPARTMENT_HEAD',
      departmentId: engineering.id
    }
  });

  const marketingHeadPassword = await hash('TruongPhong@123', 10);
  const marketingHead = await prisma.user.upsert({
    where: { email: 'truongmarketing@fpt.com.vn' },
    update: {},
    create: {
      name: 'Trưởng Phòng Marketing',
      email: 'truongmarketing@fpt.com.vn',
      password: marketingHeadPassword,
      role: 'DEPARTMENT_HEAD',
      departmentId: marketing.id
    }
  });

  const hrHeadPassword = await hash('TruongPhong@123', 10);
  const hrHead = await prisma.user.upsert({
    where: { email: 'truongnhansu@fpt.com.vn' },
    update: {},
    create: {
      name: 'Trưởng Phòng Nhân sự',
      email: 'truongnhansu@fpt.com.vn',
      password: hrHeadPassword,
      role: 'DEPARTMENT_HEAD',
      departmentId: hr.id
    }
  });

  const financeHeadPassword = await hash('TruongPhong@123', 10);
  const financeHead = await prisma.user.upsert({
    where: { email: 'truongtaichinh@fpt.com.vn' },
    update: {},
    create: {
      name: 'Trưởng Phòng Tài chính',
      email: 'truongtaichinh@fpt.com.vn',
      password: financeHeadPassword,
      role: 'DEPARTMENT_HEAD',
      departmentId: finance.id
    }
  });

  // Regular Employees
  const employeePassword = await hash('NhanVien@123', 10);
  
  // Engineering employees
  const engineeringEmployee1 = await prisma.user.upsert({
    where: { email: 'nhanvien1.kythuat@fpt.com.vn' },
    update: {},
    create: {
      name: 'Nguyễn Văn A',
      email: 'nhanvien1.kythuat@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: engineering.id
    }
  });

  const engineeringEmployee2 = await prisma.user.upsert({
    where: { email: 'nhanvien2.kythuat@fpt.com.vn' },
    update: {},
    create: {
      name: 'Lê Thị B',
      email: 'nhanvien2.kythuat@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: engineering.id
    }
  });

  // Marketing employees
  const marketingEmployee1 = await prisma.user.upsert({
    where: { email: 'nhanvien1.marketing@fpt.com.vn' },
    update: {},
    create: {
      name: 'Trần Văn C',
      email: 'nhanvien1.marketing@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: marketing.id
    }
  });

  const marketingEmployee2 = await prisma.user.upsert({
    where: { email: 'nhanvien2.marketing@fpt.com.vn' },
    update: {},
    create: {
      name: 'Phạm Thị D',
      email: 'nhanvien2.marketing@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: marketing.id
    }
  });

  // HR employees
  const hrEmployee1 = await prisma.user.upsert({
    where: { email: 'nhanvien1.nhansu@fpt.com.vn' },
    update: {},
    create: {
      name: 'Hoàng Văn E',
      email: 'nhanvien1.nhansu@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: hr.id
    }
  });

  // Finance employees
  const financeEmployee1 = await prisma.user.upsert({
    where: { email: 'nhanvien1.taichinh@fpt.com.vn' },
    update: {},
    create: {
      name: 'Vũ Thị F',
      email: 'nhanvien1.taichinh@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: finance.id
    }
  });

  // Department Heads for new departments
  const salesHeadPassword = await hash('TruongPhong@123', 10);
  const salesHead = await prisma.user.upsert({
    where: { email: 'truongkinhdoanh@fpt.com.vn' },
    update: {},
    create: {
      name: 'Trưởng Phòng Kinh doanh',
      email: 'truongkinhdoanh@fpt.com.vn',
      password: salesHeadPassword,
      role: 'DEPARTMENT_HEAD',
      departmentId: sales.id
    }
  });

  const customerServiceHeadPassword = await hash('TruongPhong@123', 10);
  const customerServiceHead = await prisma.user.upsert({
    where: { email: 'truongcskh@fpt.com.vn' },
    update: {},
    create: {
      name: 'Trưởng Phòng CSKH',
      email: 'truongcskh@fpt.com.vn',
      password: customerServiceHeadPassword,
      role: 'DEPARTMENT_HEAD',
      departmentId: customerService.id
    }
  });

  const qaHeadPassword = await hash('TruongPhong@123', 10);
  const qaHead = await prisma.user.upsert({
    where: { email: 'truongkscl@fpt.com.vn' },
    update: {},
    create: {
      name: 'Trưởng Phòng KSCL',
      email: 'truongkscl@fpt.com.vn',
      password: qaHeadPassword,
      role: 'DEPARTMENT_HEAD',
      departmentId: qa.id
    }
  });

  const productHeadPassword = await hash('TruongPhong@123', 10);
  const productHead = await prisma.user.upsert({
    where: { email: 'truongphattrien@fpt.com.vn' },
    update: {},
    create: {
      name: 'Trưởng Phòng Phát triển',
      email: 'truongphattrien@fpt.com.vn',
      password: productHeadPassword,
      role: 'DEPARTMENT_HEAD',
      departmentId: productDevelopment.id
    }
  });

  const legalHeadPassword = await hash('TruongPhong@123', 10);
  const legalHead = await prisma.user.upsert({
    where: { email: 'truongphapche@fpt.com.vn' },
    update: {},
    create: {
      name: 'Trưởng Phòng Pháp chế',
      email: 'truongphapche@fpt.com.vn',
      password: legalHeadPassword,
      role: 'DEPARTMENT_HEAD',
      departmentId: legal.id
    }
  });

  const adminHeadPassword = await hash('TruongPhong@123', 10);
  const adminHead = await prisma.user.upsert({
    where: { email: 'truonghanhchinh@fpt.com.vn' },
    update: {},
    create: {
      name: 'Trưởng Phòng Hành chính',
      email: 'truonghanhchinh@fpt.com.vn',
      password: adminHeadPassword,
      role: 'DEPARTMENT_HEAD',
      departmentId: administration.id
    }
  });

  // More engineering employees
  const engineeringEmployee3 = await prisma.user.upsert({
    where: { email: 'nhanvien3.kythuat@fpt.com.vn' },
    update: {},
    create: {
      name: 'Trần Minh Tuấn',
      email: 'nhanvien3.kythuat@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: engineering.id
    }
  });

  const engineeringEmployee4 = await prisma.user.upsert({
    where: { email: 'nhanvien4.kythuat@fpt.com.vn' },
    update: {},
    create: {
      name: 'Nguyễn Thị Hương',
      email: 'nhanvien4.kythuat@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: engineering.id
    }
  });
  
  const engineeringEmployee5 = await prisma.user.upsert({
    where: { email: 'nhanvien5.kythuat@fpt.com.vn' },
    update: {},
    create: {
      name: 'Lê Văn Dũng',
      email: 'nhanvien5.kythuat@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: engineering.id
    }
  });

  // More marketing employees
  const marketingEmployee3 = await prisma.user.upsert({
    where: { email: 'nhanvien3.marketing@fpt.com.vn' },
    update: {},
    create: {
      name: 'Phạm Vân Anh',
      email: 'nhanvien3.marketing@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: marketing.id
    }
  });

  const marketingEmployee4 = await prisma.user.upsert({
    where: { email: 'nhanvien4.marketing@fpt.com.vn' },
    update: {},
    create: {
      name: 'Ngô Quang Minh',
      email: 'nhanvien4.marketing@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: marketing.id
    }
  });

  // More HR employees
  const hrEmployee2 = await prisma.user.upsert({
    where: { email: 'nhanvien2.nhansu@fpt.com.vn' },
    update: {},
    create: {
      name: 'Nguyễn Thu Thảo',
      email: 'nhanvien2.nhansu@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: hr.id
    }
  });

  const hrEmployee3 = await prisma.user.upsert({
    where: { email: 'nhanvien3.nhansu@fpt.com.vn' },
    update: {},
    create: {
      name: 'Lê Minh Quân',
      email: 'nhanvien3.nhansu@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: hr.id
    }
  });

  // More finance employees
  const financeEmployee2 = await prisma.user.upsert({
    where: { email: 'nhanvien2.taichinh@fpt.com.vn' },
    update: {},
    create: {
      name: 'Trần Thị Mai',
      email: 'nhanvien2.taichinh@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: finance.id
    }
  });

  const financeEmployee3 = await prisma.user.upsert({
    where: { email: 'nhanvien3.taichinh@fpt.com.vn' },
    update: {},
    create: {
      name: 'Hoàng Văn Nam',
      email: 'nhanvien3.taichinh@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: finance.id
    }
  });

  // Sales employees
  const salesEmployee1 = await prisma.user.upsert({
    where: { email: 'nhanvien1.kinhdoanh@fpt.com.vn' },
    update: {},
    create: {
      name: 'Nguyễn Văn Hùng',
      email: 'nhanvien1.kinhdoanh@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: sales.id
    }
  });

  const salesEmployee2 = await prisma.user.upsert({
    where: { email: 'nhanvien2.kinhdoanh@fpt.com.vn' },
    update: {},
    create: {
      name: 'Lê Thị Hà',
      email: 'nhanvien2.kinhdoanh@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: sales.id
    }
  });

  // Customer Service employees
  const csEmployee1 = await prisma.user.upsert({
    where: { email: 'nhanvien1.cskh@fpt.com.vn' },
    update: {},
    create: {
      name: 'Trần Văn Bình',
      email: 'nhanvien1.cskh@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: customerService.id
    }
  });

  const csEmployee2 = await prisma.user.upsert({
    where: { email: 'nhanvien2.cskh@fpt.com.vn' },
    update: {},
    create: {
      name: 'Nguyễn Thị Lan',
      email: 'nhanvien2.cskh@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: customerService.id
    }
  });

  // QA employees
  const qaEmployee1 = await prisma.user.upsert({
    where: { email: 'nhanvien1.kscl@fpt.com.vn' },
    update: {},
    create: {
      name: 'Phạm Thành Trung',
      email: 'nhanvien1.kscl@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: qa.id
    }
  });

  const qaEmployee2 = await prisma.user.upsert({
    where: { email: 'nhanvien2.kscl@fpt.com.vn' },
    update: {},
    create: {
      name: 'Nguyễn Mai Anh',
      email: 'nhanvien2.kscl@fpt.com.vn',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: qa.id
    }
  });

  // Get current date and date + 1 month
  const currentDate = new Date();
  const oneMonthLater = new Date();
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

  // Create sample posts
  const welcomePost = await prisma.post.upsert({
    where: { id: 'post-1' },
    update: {},
    create: {
      id: 'post-1',
      title: 'Chào mừng đến với hệ thống quản lý nội bộ',
      content: '<p>Kính gửi toàn thể cán bộ, nhân viên,</p><p>Chúng tôi xin thông báo hệ thống quản lý nội bộ mới đã chính thức được triển khai. Đây là nơi chúng ta có thể chia sẻ thông tin, tài liệu và phối hợp công việc hiệu quả hơn.</p><p>Trân trọng,<br>Ban Quản trị</p>',
      authorId: adminUser.id,
      isPublic: true,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate,
      tags: ['thông báo', 'hệ thống']
    }
  });

  const engineeringPost = await prisma.post.upsert({
    where: { id: 'post-2' },
    update: {},
    create: {
      id: 'post-2',
      title: 'Cập nhật quy trình phát triển phần mềm',
      content: '<p>Kính gửi các thành viên phòng kỹ thuật,</p><p>Phòng kỹ thuật xin thông báo về việc cập nhật quy trình phát triển phần mềm mới. Chi tiết như sau:</p><ul><li>Áp dụng mô hình Agile Scrum</li><li>Sprint kéo dài 2 tuần</li><li>Code review bắt buộc trước khi merge</li></ul><p>Trân trọng,</p>',
      authorId: engineeringHead.id,
      departmentId: engineering.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate,
      tags: ['quy trình', 'phát triển', 'kỹ thuật']
    }
  });

  const marketingPost = await prisma.post.upsert({
    where: { id: 'post-3' },
    update: {},
    create: {
      id: 'post-3',
      title: 'Kế hoạch Marketing Q3/2023',
      content: '<p>Kính gửi các thành viên phòng Marketing,</p><p>Dưới đây là kế hoạch marketing cho quý 3 năm 2023:</p><ul><li>Chiến dịch quảng cáo sản phẩm mới</li><li>Tổ chức sự kiện ra mắt vào tháng 8</li><li>Đẩy mạnh marketing trên các kênh social media</li></ul><p>Chi tiết sẽ được trao đổi trong cuộc họp ngày 15/07/2023.</p>',
      authorId: marketingHead.id,
      departmentId: marketing.id,
      isPublic: false,
      status: 'PENDING',
      tags: ['marketing', 'kế hoạch', 'Q3-2023']
    }
  });

  // Pending approval post
  const pendingPost = await prisma.post.upsert({
    where: { id: 'post-4' },
    update: {},
    create: {
      id: 'post-4',
      title: 'Đề xuất chính sách làm việc từ xa',
      content: '<p>Kính gửi Ban Lãnh đạo và Phòng Nhân sự,</p><p>Tôi xin đề xuất chính sách làm việc từ xa như sau:</p><ul><li>Nhân viên được phép làm việc từ xa 2 ngày/tuần</li><li>Đảm bảo hiệu suất và báo cáo hàng ngày</li><li>Tham gia đầy đủ các cuộc họp trực tuyến</li></ul><p>Kính mong Ban Lãnh đạo xem xét.</p><p>Trân trọng,</p>',
      authorId: hrHead.id,
      departmentId: hr.id,
      isPublic: true,
      status: 'PENDING',
      tags: ['đề xuất', 'nhân sự', 'làm việc từ xa']
    }
  });

  // Rejected post
  const rejectedPost = await prisma.post.upsert({
    where: { id: 'post-5' },
    update: {},
    create: {
      id: 'post-5',
      title: 'Kế hoạch du lịch cuối năm',
      content: '<p>Kính gửi toàn thể CBNV,</p><p>Phòng Hành chính đề xuất kế hoạch du lịch cuối năm như sau:</p><ul><li>Thời gian: 25-27/12/2023</li><li>Địa điểm: Đà Nẵng</li><li>Chi phí dự kiến: xxx</li></ul><p>Kính mong Ban Lãnh đạo xem xét và phê duyệt.</p>',
      authorId: marketingHead.id,
      isPublic: true,
      status: 'REJECTED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate,
      tags: ['du lịch', 'cuối năm']
    }
  });

  // Additional posts
  const salesPost = await prisma.post.upsert({
    where: { id: 'post-6' },
    update: {},
    create: {
      id: 'post-6',
      title: 'Kế hoạch kinh doanh Q4/2023',
      content: '<p>Kính gửi các thành viên phòng Kinh doanh,</p><p>Dưới đây là chỉ tiêu kinh doanh Q4/2023:</p><ul><li>Doanh số mục tiêu: 5 tỷ đồng</li><li>Số lượng khách hàng mới: 50</li><li>Tỷ lệ chuyển đổi: 25%</li></ul><p>Trân trọng,</p>',
      authorId: salesHead.id,
      departmentId: sales.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate,
      tags: ['kinh doanh', 'kế hoạch', 'Q4-2023']
    }
  });

  const qaPost = await prisma.post.upsert({
    where: { id: 'post-7' },
    update: {},
    create: {
      id: 'post-7',
      title: 'Quy trình kiểm soát chất lượng mới',
      content: '<p>Kính gửi các thành viên phòng KSCL,</p><p>Từ ngày 01/08/2023, chúng ta sẽ áp dụng quy trình kiểm soát chất lượng mới như sau:</p><ul><li>Đánh giá sản phẩm theo tiêu chuẩn ISO 9001:2015</li><li>Kiểm thử tự động và thủ công song song</li><li>Báo cáo hàng tuần về các lỗi phát hiện được</li></ul>',
      authorId: qaHead.id,
      departmentId: qa.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate,
      tags: ['chất lượng', 'quy trình', 'kiểm thử']
    }
  });

  const productPost = await prisma.post.upsert({
    where: { id: 'post-8' },
    update: {},
    create: {
      id: 'post-8',
      title: 'Ý tưởng phát triển sản phẩm mới',
      content: '<p>Kính gửi Ban lãnh đạo và Phòng Phát triển Sản phẩm,</p><p>Tôi xin đề xuất ý tưởng về sản phẩm mới như sau:</p><ul><li>Ứng dụng quản lý tài chính cá nhân</li><li>Tích hợp AI để tư vấn đầu tư</li><li>Kết nối với ngân hàng và ví điện tử</li></ul><p>Kính mong nhận được ý kiến phản hồi.</p>',
      authorId: productHead.id,
      departmentId: productDevelopment.id,
      isPublic: false,
      status: 'PENDING',
      tags: ['sản phẩm mới', 'ý tưởng', 'phát triển']
    }
  });

  const financePost = await prisma.post.upsert({
    where: { id: 'post-9' },
    update: {},
    create: {
      id: 'post-9',
      title: 'Báo cáo tài chính Q2/2023',
      content: '<p>Kính gửi Ban lãnh đạo,</p><p>Phòng Tài chính xin gửi báo cáo tài chính Q2/2023 với các chỉ số chính như sau:</p><ul><li>Doanh thu: 20 tỷ đồng (tăng 15% so với Q1)</li><li>Chi phí: 15 tỷ đồng</li><li>Lợi nhuận: 5 tỷ đồng</li></ul><p>Chi tiết báo cáo đã được đăng tải trên hệ thống.</p>',
      authorId: financeHead.id,
      departmentId: finance.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate,
      tags: ['tài chính', 'báo cáo', 'Q2-2023']
    }
  });

  const servicePost = await prisma.post.upsert({
    where: { id: 'post-10' },
    update: {},
    create: {
      id: 'post-10',
      title: 'Thống kê phản hồi khách hàng tháng 7/2023',
      content: '<p>Kính gửi các thành viên phòng CSKH,</p><p>Dưới đây là thống kê phản hồi khách hàng tháng 7/2023:</p><ul><li>Tổng số phản hồi: 230</li><li>Đánh giá tích cực: 180 (78%)</li><li>Đánh giá tiêu cực: 50 (22%)</li><li>Thời gian phản hồi trung bình: 4 giờ</li></ul><p>Chi tiết báo cáo đã được đăng tải lên hệ thống.</p>',
      authorId: customerServiceHead.id,
      departmentId: customerService.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate,
      tags: ['CSKH', 'phản hồi', 'thống kê']
    }
  });

  const legalPost = await prisma.post.upsert({
    where: { id: 'post-11' },
    update: {},
    create: {
      id: 'post-11',
      title: 'Cập nhật quy định pháp luật về SHTT',
      content: '<p>Kính gửi toàn thể CBNV,</p><p>Phòng Pháp chế xin thông báo về việc cập nhật quy định mới về Sở hữu Trí tuệ có hiệu lực từ ngày 01/09/2023. Các điểm chính cần lưu ý:</p><ul><li>Tăng cường bảo vệ quyền tác giả trên môi trường số</li><li>Quy định mới về đăng ký sáng chế và quyền sở hữu công nghiệp</li><li>Xử phạt nghiêm các hành vi vi phạm bản quyền</li></ul>',
      authorId: legalHead.id,
      departmentId: legal.id,
      isPublic: true,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate,
      tags: ['pháp luật', 'SHTT', 'quy định mới']
    }
  });

  const hrPost = await prisma.post.upsert({
    where: { id: 'post-12' },
    update: {},
    create: {
      id: 'post-12',
      title: 'Kế hoạch tuyển dụng Q3/2023',
      content: '<p>Kính gửi Ban lãnh đạo và các Trưởng phòng,</p><p>Phòng Nhân sự xin thông báo kế hoạch tuyển dụng Q3/2023 như sau:</p><ul><li>Phòng Kỹ thuật: 5 vị trí (2 Senior, 3 Junior)</li><li>Phòng Marketing: 2 vị trí</li><li>Phòng Kinh doanh: 3 vị trí</li><li>Phòng CSKH: 2 vị trí</li></ul><p>Đề nghị các phòng ban gửi mô tả công việc chi tiết trước ngày 15/07/2023.</p>',
      authorId: hrHead.id,
      departmentId: hr.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate,
      tags: ['nhân sự', 'tuyển dụng', 'Q3-2023']
    }
  });

  const adminPost = await prisma.post.upsert({
    where: { id: 'post-13' },
    update: {},
    create: {
      id: 'post-13',
      title: 'Hướng dẫn sử dụng không gian làm việc mới',
      content: '<p>Kính gửi toàn thể CBNV,</p><p>Phòng Hành chính xin thông báo về việc cải tạo không gian làm việc tại tầng 3 và 4. Một số quy định cần lưu ý:</p><ul><li>Khu vực họp nhóm: Đặt lịch qua hệ thống</li><li>Khu vực làm việc yên tĩnh: Không gọi điện thoại</li><li>Khu vực sáng tạo: Tự do thảo luận và brainstorm</li></ul><p>Mọi góp ý xin gửi về email hanhchinh@fpt.com.vn</p>',
      authorId: adminHead.id,
      departmentId: administration.id,
      isPublic: true,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate,
      tags: ['hành chính', 'văn phòng', 'quy định']
    }
  });

  const engineeringPost2 = await prisma.post.upsert({
    where: { id: 'post-14' },
    update: {},
    create: {
      id: 'post-14',
      title: 'Cập nhật công nghệ mới Q3/2023',
      content: '<p>Kính gửi các thành viên phòng Kỹ thuật,</p><p>Trong Q3/2023, chúng ta sẽ áp dụng một số công nghệ mới sau:</p><ul><li>Chuyển đổi từ REST API sang GraphQL</li><li>Áp dụng Kubernetes cho môi trường production</li><li>Sử dụng Terraform cho Infrastructure as Code</li></ul><p>Các khóa đào tạo sẽ được tổ chức từ tuần sau.</p>',
      authorId: engineeringHead.id,
      departmentId: engineering.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate,
      tags: ['kỹ thuật', 'công nghệ', 'đào tạo']
    }
  });

  const marketingPost2 = await prisma.post.upsert({
    where: { id: 'post-15' },
    update: {},
    create: {
      id: 'post-15',
      title: 'Chiến dịch quảng cáo sản phẩm XYZ',
      content: '<p>Kính gửi các thành viên phòng Marketing,</p><p>Chúng ta sẽ triển khai chiến dịch quảng cáo sản phẩm XYZ với các nội dung sau:</p><ul><li>Thời gian: 15/08 - 15/09/2023</li><li>Kênh: Facebook, Google, TikTok</li><li>Ngân sách: 500 triệu đồng</li><li>KPI: 10,000 leads, 1,000 conversions</li></ul><p>Chi tiết kế hoạch và phân công công việc sẽ được thảo luận trong cuộc họp ngày 05/08.</p>',
      authorId: marketingHead.id,
      departmentId: marketing.id,
      isPublic: false,
      status: 'PENDING',
      tags: ['marketing', 'chiến dịch', 'quảng cáo']
    }
  });

  // Sample employee posts
  const employeePost1 = await prisma.post.upsert({
    where: { id: 'post-16' },
    update: {},
    create: {
      id: 'post-16',
      title: 'Chia sẻ kinh nghiệm tối ưu code React',
      content: '<p>Xin chào các đồng nghiệp,</p><p>Tôi muốn chia sẻ một số kinh nghiệm tối ưu code React:</p><ul><li>Sử dụng React.memo cho components render nhiều lần</li><li>Tối ưu useEffect để tránh re-render không cần thiết</li><li>Áp dụng code splitting để giảm kích thước bundle</li></ul><p>Mọi người có thể tham khảo repo mẫu tại: github.com/username/react-optimizations</p>',
      authorId: engineeringEmployee1.id,
      departmentId: engineering.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: engineeringHead.id,
      reviewedAt: currentDate,
      tags: ['React', 'frontend', 'tối ưu', 'chia sẻ']
    }
  });

  const employeePost2 = await prisma.post.upsert({
    where: { id: 'post-17' },
    update: {},
    create: {
      id: 'post-17',
      title: 'Đề xuất cải thiện quy trình onboarding',
      content: '<p>Kính gửi Phòng Nhân sự,</p><p>Qua quá trình làm việc, tôi có một số đề xuất cải thiện quy trình onboarding nhân viên mới:</p><ul><li>Xây dựng tài liệu hướng dẫn chi tiết cho từng vị trí</li><li>Phân công mentor hỗ trợ 1-1 trong 2 tuần đầu</li><li>Tổ chức check-in hàng tuần trong tháng đầu tiên</li></ul><p>Tôi tin rằng những cải tiến này sẽ giúp nhân viên mới hòa nhập nhanh chóng và hiệu quả hơn.</p>',
      authorId: hrEmployee2.id,
      departmentId: hr.id,
      isPublic: false,
      status: 'PENDING',
      tags: ['nhân sự', 'onboarding', 'cải tiến']
    }
  });

  const employeePost3 = await prisma.post.upsert({
    where: { id: 'post-18' },
    update: {},
    create: {
      id: 'post-18',
      title: 'Báo cáo khảo sát khách hàng tháng 6/2023',
      content: '<p>Kính gửi Trưởng phòng CSKH,</p><p>Tôi xin gửi báo cáo khảo sát khách hàng tháng 6/2023 với một số phát hiện chính:</p><ul><li>85% khách hàng hài lòng với sản phẩm/dịch vụ</li><li>Điểm NPS đạt 8.5/10, tăng 0.5 điểm so với tháng 5</li><li>Top 3 đề xuất cải tiến: giao diện người dùng, tốc độ phản hồi, tính năng tìm kiếm</li></ul><p>Báo cáo chi tiết đã được đính kèm trong email.</p>',
      authorId: csEmployee1.id,
      departmentId: customerService.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: customerServiceHead.id,
      reviewedAt: currentDate,
      tags: ['CSKH', 'khảo sát', 'báo cáo']
    }
  });

  const employeePost4 = await prisma.post.upsert({
    where: { id: 'post-19' },
    update: {},
    create: {
      id: 'post-19',
      title: 'Thống kê bug trên sản phẩm ABC',
      content: '<p>Kính gửi Trưởng phòng KSCL,</p><p>Tôi xin báo cáo thống kê bug trên sản phẩm ABC:</p><ul><li>Tổng số bug: 45 (15 critical, 20 major, 10 minor)</li><li>Đã fix: 30 (10 critical, 15 major, 5 minor)</li><li>Đang xử lý: 15</li></ul><p>Chi tiết danh sách bug đã được cập nhật trên hệ thống Jira.</p>',
      authorId: qaEmployee1.id,
      departmentId: qa.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: qaHead.id,
      reviewedAt: currentDate,
      tags: ['QA', 'bug', 'báo cáo']
    }
  });

  const employeePost5 = await prisma.post.upsert({
    where: { id: 'post-20' },
    update: {},
    create: {
      id: 'post-20',
      title: 'Đề xuất chương trình khuyến mãi Q4/2023',
      content: '<p>Kính gửi Trưởng phòng Kinh doanh,</p><p>Tôi xin đề xuất chương trình khuyến mãi Q4/2023 như sau:</p><ul><li>Giảm giá 20% cho khách hàng mới trong tháng 10</li><li>Tặng 3 tháng sử dụng miễn phí tính năng premium cho khách hàng gia hạn</li><li>Chương trình giới thiệu: Tặng 500.000đ cho mỗi khách hàng mới được giới thiệu</li></ul><p>Kính mong Trưởng phòng xem xét và phê duyệt.</p>',
      authorId: salesEmployee1.id,
      departmentId: sales.id,
      isPublic: false,
      status: 'PENDING',
      tags: ['kinh doanh', 'khuyến mãi', 'đề xuất']
    }
  });

  // Create sample documents
  const technicalDoc = await prisma.document.upsert({
    where: { id: 'doc-1' },
    update: {},
    create: {
      id: 'doc-1',
      title: 'Tài liệu hướng dẫn sử dụng phần mềm XYZ',
      description: 'Hướng dẫn chi tiết cách sử dụng phần mềm XYZ cho người dùng cuối',
      category: 'GUIDE',
      filePath: '/documents/tech/xyz-user-guide.pdf',
      uploadedById: engineeringHead.id,
      departmentId: engineering.id,
      isPublic: true,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate
    }
  });

  const marketingReport = await prisma.document.upsert({
    where: { id: 'doc-2' },
    update: {},
    create: {
      id: 'doc-2',
      title: 'Báo cáo phân tích thị trường Q2/2023',
      description: 'Báo cáo chi tiết phân tích thị trường và đối thủ cạnh tranh Q2/2023',
      category: 'REPORT',
      filePath: '/documents/marketing/market-analysis-q2-2023.pdf',
      uploadedById: marketingHead.id,
      departmentId: marketing.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate
    }
  });

  const contractTemplate = await prisma.document.upsert({
    where: { id: 'doc-3' },
    update: {},
    create: {
      id: 'doc-3',
      title: 'Mẫu Hợp đồng Lao động 2023',
      description: 'Mẫu hợp đồng lao động cập nhật theo quy định mới nhất',
      category: 'CONTRACT',
      filePath: '/documents/hr/labor-contract-template-2023.docx',
      uploadedById: hrHead.id,
      departmentId: hr.id,
      isPublic: true,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate
    }
  });

  // Pending document
  const pendingDocument = await prisma.document.upsert({
    where: { id: 'doc-4' },
    update: {},
    create: {
      id: 'doc-4',
      title: 'Kế hoạch tài chính 2024',
      description: 'Dự thảo kế hoạch tài chính cho năm 2024',
      category: 'REPORT',
      filePath: '/documents/finance/financial-plan-2024.xlsx',
      uploadedById: financeHead.id,
      departmentId: finance.id,
      isPublic: true,
      status: 'PENDING'
    }
  });

  // Rejected document
  const rejectedDocument = await prisma.document.upsert({
    where: { id: 'doc-5' },
    update: {},
    create: {
      id: 'doc-5',
      title: 'Đề xuất điều chỉnh lương 2023',
      description: 'Đề xuất điều chỉnh lương nhân viên năm 2023',
      category: 'FORM',
      filePath: '/documents/hr/salary-adjustment-2023.xlsx',
      uploadedById: hrHead.id,
      departmentId: hr.id,
      isPublic: false,
      status: 'REJECTED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate
    }
  });

  // Additional documents
  const productRequirements = await prisma.document.upsert({
    where: { id: 'doc-6' },
    update: {},
    create: {
      id: 'doc-6',
      title: 'Tài liệu yêu cầu sản phẩm XYZ v2.0',
      description: 'Tài liệu mô tả chi tiết các yêu cầu cho phiên bản 2.0 của sản phẩm XYZ',
      category: 'OTHER',
      filePath: '/documents/product/xyz-requirements-v2.pdf',
      uploadedById: productHead.id,
      departmentId: productDevelopment.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate
    }
  });

  const marketingGuidelines = await prisma.document.upsert({
    where: { id: 'doc-7' },
    update: {},
    create: {
      id: 'doc-7',
      title: 'Hướng dẫn sử dụng thương hiệu 2023',
      description: 'Tài liệu hướng dẫn sử dụng thương hiệu, logo và ngôn ngữ truyền thông',
      category: 'GUIDE',
      filePath: '/documents/marketing/brand-guidelines-2023.pdf',
      uploadedById: marketingHead.id,
      departmentId: marketing.id,
      isPublic: true,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate
    }
  });

  const salesReport = await prisma.document.upsert({
    where: { id: 'doc-8' },
    update: {},
    create: {
      id: 'doc-8',
      title: 'Báo cáo bán hàng Q2/2023',
      description: 'Báo cáo chi tiết kết quả bán hàng Quý 2/2023',
      category: 'REPORT',
      filePath: '/documents/sales/sales-report-q2-2023.pdf',
      uploadedById: salesHead.id,
      departmentId: sales.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate
    }
  });

  const qaTestPlan = await prisma.document.upsert({
    where: { id: 'doc-9' },
    update: {},
    create: {
      id: 'doc-9',
      title: 'Kế hoạch kiểm thử sản phẩm ABC v3.0',
      description: 'Kế hoạch và quy trình kiểm thử chi tiết cho sản phẩm ABC phiên bản 3.0',
      category: 'OTHER',
      filePath: '/documents/qa/abc-test-plan-v3.pdf',
      uploadedById: qaHead.id,
      departmentId: qa.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate
    }
  });

  const legalContract = await prisma.document.upsert({
    where: { id: 'doc-10' },
    update: {},
    create: {
      id: 'doc-10',
      title: 'Mẫu hợp đồng hợp tác kinh doanh 2023',
      description: 'Mẫu hợp đồng hợp tác kinh doanh cập nhật theo quy định pháp luật hiện hành',
      category: 'CONTRACT',
      filePath: '/documents/legal/business-contract-template-2023.docx',
      uploadedById: legalHead.id,
      departmentId: legal.id,
      isPublic: true,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate
    }
  });

  const engineeringArchitecture = await prisma.document.upsert({
    where: { id: 'doc-11' },
    update: {},
    create: {
      id: 'doc-11',
      title: 'Tài liệu kiến trúc hệ thống 2023',
      description: 'Tài liệu mô tả chi tiết kiến trúc hệ thống phần mềm hiện tại',
      category: 'OTHER',
      filePath: '/documents/tech/system-architecture-2023.pdf',
      uploadedById: engineeringHead.id,
      departmentId: engineering.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate
    }
  });

  const financePolicy = await prisma.document.upsert({
    where: { id: 'doc-12' },
    update: {},
    create: {
      id: 'doc-12',
      title: 'Quy chế tài chính nội bộ 2023',
      description: 'Quy chế quản lý tài chính nội bộ công ty năm 2023',
      category: 'OTHER',
      filePath: '/documents/finance/financial-policy-2023.pdf',
      uploadedById: financeHead.id,
      departmentId: finance.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate
    }
  });

  const hrHandbook = await prisma.document.upsert({
    where: { id: 'doc-13' },
    update: {},
    create: {
      id: 'doc-13',
      title: 'Sổ tay nhân viên 2023',
      description: 'Sổ tay dành cho nhân viên với các thông tin, quy định và chính sách cần biết',
      category: 'GUIDE',
      filePath: '/documents/hr/employee-handbook-2023.pdf',
      uploadedById: hrHead.id,
      departmentId: hr.id,
      isPublic: true,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate
    }
  });

  const csHandbook = await prisma.document.upsert({
    where: { id: 'doc-14' },
    update: {},
    create: {
      id: 'doc-14',
      title: 'Sổ tay chăm sóc khách hàng',
      description: 'Hướng dẫn quy trình và kỹ năng chăm sóc khách hàng',
      category: 'GUIDE',
      filePath: '/documents/cs/customer-service-handbook.pdf',
      uploadedById: customerServiceHead.id,
      departmentId: customerService.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate
    }
  });

  const adminProcedure = await prisma.document.upsert({
    where: { id: 'doc-15' },
    update: {},
    create: {
      id: 'doc-15',
      title: 'Quy trình hành chính 2023',
      description: 'Tài liệu mô tả các quy trình hành chính nội bộ',
      category: 'OTHER',
      filePath: '/documents/admin/administrative-procedures-2023.pdf',
      uploadedById: adminHead.id,
      departmentId: administration.id,
      isPublic: true,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate
    }
  });

  const productRoadmap = await prisma.document.upsert({
    where: { id: 'doc-16' },
    update: {},
    create: {
      id: 'doc-16',
      title: 'Lộ trình phát triển sản phẩm 2023-2024',
      description: 'Tài liệu lộ trình phát triển sản phẩm cho năm 2023-2024',
      category: 'OTHER',
      filePath: '/documents/product/product-roadmap-2023-2024.pdf',
      uploadedById: productHead.id,
      departmentId: productDevelopment.id,
      isPublic: false,
      status: 'PENDING'
    }
  });

  const salesTraining = await prisma.document.upsert({
    where: { id: 'doc-17' },
    update: {},
    create: {
      id: 'doc-17',
      title: 'Tài liệu đào tạo kỹ năng bán hàng',
      description: 'Tài liệu đào tạo kỹ năng bán hàng và tư vấn khách hàng',
      category: 'GUIDE',
      filePath: '/documents/sales/sales-skills-training.pdf',
      uploadedById: salesHead.id,
      departmentId: sales.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate
    }
  });

  const techStandards = await prisma.document.upsert({
    where: { id: 'doc-18' },
    update: {},
    create: {
      id: 'doc-18',
      title: 'Tiêu chuẩn lập trình 2023',
      description: 'Tài liệu quy định về tiêu chuẩn và quy ước lập trình',
      category: 'OTHER',
      filePath: '/documents/tech/coding-standards-2023.pdf',
      uploadedById: engineeringHead.id,
      departmentId: engineering.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate
    }
  });

  const marketingBudget = await prisma.document.upsert({
    where: { id: 'doc-19' },
    update: {},
    create: {
      id: 'doc-19',
      title: 'Kế hoạch ngân sách Marketing 2023',
      description: 'Kế hoạch chi tiết ngân sách Marketing theo quý cho năm 2023',
      category: 'REPORT',
      filePath: '/documents/marketing/marketing-budget-2023.xlsx',
      uploadedById: marketingHead.id,
      departmentId: marketing.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate
    }
  });

  const hrRecruitmentPlan = await prisma.document.upsert({
    where: { id: 'doc-20' },
    update: {},
    create: {
      id: 'doc-20',
      title: 'Kế hoạch tuyển dụng 2023',
      description: 'Kế hoạch tuyển dụng nhân sự cho năm 2023',
      category: 'OTHER',
      filePath: '/documents/hr/recruitment-plan-2023.pdf',
      uploadedById: hrHead.id,
      departmentId: hr.id,
      isPublic: false,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: currentDate
    }
  });

  // Create review comments
  const commentOnRejectedDoc = await prisma.reviewComment.upsert({
    where: { id: 'comment-1' },
    update: {},
    create: {
      id: 'comment-1',
      content: 'Đề xuất cần được cập nhật theo chính sách mới nhất và làm rõ nguồn kinh phí.',
      userId: adminUser.id,
      documentId: rejectedDocument.id,
      createdAt: currentDate
    }
  });

  const commentOnRejectedPost = await prisma.reviewComment.upsert({
    where: { id: 'comment-2' },
    update: {},
    create: {
      id: 'comment-2',
      content: 'Vui lòng cập nhật thêm thông tin chi tiết về ngân sách và chương trình du lịch cụ thể.',
      userId: adminUser.id,
      postId: rejectedPost.id,
      createdAt: currentDate
    }
  });

  // Additional review comments
  const commentOnPendingDoc = await prisma.reviewComment.upsert({
    where: { id: 'comment-3' },
    update: {},
    create: {
      id: 'comment-3',
      content: 'Cần bổ sung thêm phân tích chi tiết về xu hướng thị trường và đối thủ cạnh tranh.',
      userId: adminUser.id,
      documentId: pendingDocument.id,
      createdAt: currentDate
    }
  });

  const commentOnPendingPost = await prisma.reviewComment.upsert({
    where: { id: 'comment-4' },
    update: {},
    create: {
      id: 'comment-4',
      content: 'Đề nghị bổ sung thêm đánh giá tác động và chi phí thực hiện của chính sách này.',
      userId: adminUser.id,
      postId: pendingPost.id,
      createdAt: currentDate
    }
  });

  const commentOnProductRoadmap = await prisma.reviewComment.upsert({
    where: { id: 'comment-5' },
    update: {},
    create: {
      id: 'comment-5',
      content: 'Cần bổ sung thông tin về nguồn lực cần thiết và đánh giá rủi ro cho từng giai đoạn.',
      userId: adminUser.id,
      documentId: productRoadmap.id,
      createdAt: currentDate
    }
  });

  const commentOnMarketingPost = await prisma.reviewComment.upsert({
    where: { id: 'comment-6' },
    update: {},
    create: {
      id: 'comment-6',
      content: 'Đề nghị cập nhật thêm thông tin về đối tượng khách hàng mục tiêu và chỉ số KPI cụ thể.',
      userId: adminUser.id,
      postId: marketingPost.id,
      createdAt: currentDate
    }
  });

  const commentOnEmployeePost = await prisma.reviewComment.upsert({
    where: { id: 'comment-7' },
    update: {},
    create: {
      id: 'comment-7',
      content: 'Đề xuất rất tốt. Cần thêm chi tiết về cách thực hiện và thời gian áp dụng.',
      userId: hrHead.id,
      postId: employeePost2.id,
      createdAt: currentDate
    }
  });

  const commentOnProductPost = await prisma.reviewComment.upsert({
    where: { id: 'comment-8' },
    update: {},
    create: {
      id: 'comment-8',
      content: 'Ý tưởng sáng tạo. Cần phân tích thêm về tính khả thi và nguồn lực cần thiết.',
      userId: adminUser.id,
      postId: productPost.id,
      createdAt: currentDate
    }
  });

  const commentOnSalesPromotion = await prisma.reviewComment.upsert({
    where: { id: 'comment-9' },
    update: {},
    create: {
      id: 'comment-9',
      content: 'Đề xuất hợp lý. Cần thêm phân tích tác động đến doanh thu và lợi nhuận.',
      userId: salesHead.id,
      postId: employeePost5.id,
      createdAt: currentDate
    }
  });

  const commentOnMarketingPost2 = await prisma.reviewComment.upsert({
    where: { id: 'comment-10' },
    update: {},
    create: {
      id: 'comment-10',
      content: 'Cần điều chỉnh ngân sách và thời gian thực hiện để phù hợp với kế hoạch Q4.',
      userId: adminUser.id,
      postId: marketingPost2.id,
      createdAt: currentDate
    }
  });

  // Create sample events
  const companyEvent = await prisma.event.upsert({
    where: { id: 'event-1' },
    update: {},
    create: {
      id: 'event-1',
      title: 'Họp Toàn Công ty Quý 3/2023',
      description: 'Cuộc họp tổng kết quý 2 và kế hoạch quý 3 năm 2023',
      location: 'Phòng họp lớn, Tầng 5',
      startDate: currentDate,
      endDate: oneMonthLater,
      createdById: adminUser.id,
      isPublic: true
    }
  });

  const techMeeting = await prisma.event.upsert({
    where: { id: 'event-2' },
    update: {},
    create: {
      id: 'event-2',
      title: 'Họp Sprint Planning - Sprint 15',
      description: 'Lập kế hoạch cho Sprint 15 của dự án ABC',
      location: 'Phòng họp A, Tầng 3',
      startDate: currentDate,
      endDate: oneMonthLater,
      createdById: engineeringHead.id,
      departmentId: engineering.id,
      isPublic: false
    }
  });

  // Additional events
  const hrTraining = await prisma.event.upsert({
    where: { id: 'event-3' },
    update: {},
    create: {
      id: 'event-3',
      title: 'Đào tạo Kỹ năng Quản lý',
      description: 'Chương trình đào tạo kỹ năng quản lý cho cấp quản lý trung',
      location: 'Phòng hội thảo, Tầng 2',
      startDate: currentDate,
      endDate: oneMonthLater,
      createdById: hrHead.id,
      isPublic: true
    }
  });

  const marketingWorkshop = await prisma.event.upsert({
    where: { id: 'event-4' },
    update: {},
    create: {
      id: 'event-4',
      title: 'Workshop Chiến lược Content Marketing',
      description: 'Workshop chia sẻ về chiến lược và kỹ thuật content marketing hiệu quả',
      location: 'Phòng hội thảo A, Tầng 3',
      startDate: currentDate,
      endDate: oneMonthLater,
      createdById: marketingHead.id,
      departmentId: marketing.id,
      isPublic: false
    }
  });

  const productDemo = await prisma.event.upsert({
    where: { id: 'event-5' },
    update: {},
    create: {
      id: 'event-5',
      title: 'Demo Sản phẩm XYZ phiên bản 2.0',
      description: 'Demo và giới thiệu các tính năng mới của sản phẩm XYZ phiên bản 2.0',
      location: 'Phòng họp lớn, Tầng 5',
      startDate: currentDate,
      endDate: oneMonthLater,
      createdById: productHead.id,
      isPublic: true
    }
  });

  const salesTrainingEvent = await prisma.event.upsert({
    where: { id: 'event-6' },
    update: {},
    create: {
      id: 'event-6',
      title: 'Đào tạo Kỹ năng Bán hàng',
      description: 'Chương trình đào tạo kỹ năng bán hàng và tư vấn khách hàng',
      location: 'Phòng hội thảo B, Tầng 2',
      startDate: currentDate,
      endDate: oneMonthLater,
      createdById: salesHead.id,
      departmentId: sales.id,
      isPublic: false
    }
  });

  const teamBuilding = await prisma.event.upsert({
    where: { id: 'event-7' },
    update: {},
    create: {
      id: 'event-7',
      title: 'Team Building Q3/2023',
      description: 'Hoạt động team building Q3/2023 tại Vũng Tàu',
      location: 'Vũng Tàu',
      startDate: currentDate,
      endDate: oneMonthLater,
      createdById: hrHead.id,
      isPublic: true
    }
  });

  const techTalk = await prisma.event.upsert({
    where: { id: 'event-8' },
    update: {},
    create: {
      id: 'event-8',
      title: 'Tech Talk: Microservices Architecture',
      description: 'Buổi chia sẻ về kiến trúc microservices và ứng dụng thực tế',
      location: 'Phòng hội thảo, Tầng 3',
      startDate: currentDate,
      endDate: oneMonthLater,
      createdById: engineeringHead.id,
      departmentId: engineering.id,
      isPublic: false
    }
  });

  const financeWorkshop = await prisma.event.upsert({
    where: { id: 'event-9' },
    update: {},
    create: {
      id: 'event-9',
      title: 'Workshop: Quy trình Báo cáo Tài chính',
      description: 'Workshop hướng dẫn quy trình lập và trình bày báo cáo tài chính',
      location: 'Phòng họp B, Tầng 4',
      startDate: currentDate,
      endDate: oneMonthLater,
      createdById: financeHead.id,
      departmentId: finance.id,
      isPublic: false
    }
  });

  const customerFeedbackWorkshop = await prisma.event.upsert({
    where: { id: 'event-10' },
    update: {},
    create: {
      id: 'event-10',
      title: 'Workshop: Phân tích Phản hồi Khách hàng',
      description: 'Workshop về cách thu thập và phân tích phản hồi khách hàng hiệu quả',
      location: 'Phòng họp C, Tầng 3',
      startDate: currentDate,
      endDate: oneMonthLater,
      createdById: customerServiceHead.id,
      departmentId: customerService.id,
      isPublic: false
    }
  });

  const productPlanning = await prisma.event.upsert({
    where: { id: 'event-11' },
    update: {},
    create: {
      id: 'event-11',
      title: 'Lập kế hoạch Sản phẩm Q4/2023',
      description: 'Cuộc họp lập kế hoạch phát triển sản phẩm Q4/2023',
      location: 'Phòng họp A, Tầng 4',
      startDate: currentDate,
      endDate: oneMonthLater,
      createdById: productHead.id,
      departmentId: productDevelopment.id,
      isPublic: false
    }
  });

  const legalWorkshop = await prisma.event.upsert({
    where: { id: 'event-12' },
    update: {},
    create: {
      id: 'event-12',
      title: 'Workshop: Tuân thủ GDPR và Luật Bảo vệ Dữ liệu',
      description: 'Workshop về các quy định GDPR và luật bảo vệ dữ liệu cá nhân',
      location: 'Phòng họp B, Tầng 3',
      startDate: currentDate,
      endDate: oneMonthLater,
      createdById: legalHead.id,
      departmentId: legal.id,
      isPublic: false
    }
  });

  // Additional notifications
  const vacationNotification = await prisma.notification.upsert({
    where: { id: 'notif-3' },
    update: {},
    create: {
      id: 'notif-3',
      title: 'Đăng ký nghỉ phép Q3/2023',
      content: 'Thông báo về việc đăng ký nghỉ phép Q3/2023. Đề nghị CBNV đăng ký trước ngày 15/07/2023.',
      createdById: hrHead.id,
      isPublic: true
    }
  });

  const securityUpdate = await prisma.notification.upsert({
    where: { id: 'notif-4' },
    update: {},
    create: {
      id: 'notif-4',
      title: 'Cập nhật Chính sách Bảo mật',
      content: 'Thông báo về việc cập nhật chính sách bảo mật thông tin. Vui lòng đọc kỹ và tuân thủ các quy định mới.',
      createdById: engineeringHead.id,
      isPublic: true
    }
  });

  const officeClosureNotification = await prisma.notification.upsert({
    where: { id: 'notif-5' },
    update: {},
    create: {
      id: 'notif-5',
      title: 'Thông báo đóng cửa văn phòng ngày 02/09/2023',
      content: 'Thông báo về việc đóng cửa văn phòng vào ngày 02/09/2023 nhân dịp Lễ Quốc khánh.',
      createdById: adminHead.id,
      isPublic: true
    }
  });

  const engineeringDeployment = await prisma.notification.upsert({
    where: { id: 'notif-6' },
    update: {},
    create: {
      id: 'notif-6',
      title: 'Triển khai phiên bản mới ngày 10/07/2023',
      content: 'Thông báo về việc triển khai phiên bản phần mềm mới vào ngày 10/07/2023. Hệ thống sẽ tạm ngưng hoạt động từ 22:00 - 24:00.',
      createdById: engineeringHead.id,
      departmentId: engineering.id,
      isPublic: false
    }
  });

  const financeDeadline = await prisma.notification.upsert({
    where: { id: 'notif-7' },
    update: {},
    create: {
      id: 'notif-7',
      title: 'Thời hạn nộp báo cáo chi phí tháng 6/2023',
      content: 'Thông báo về thời hạn nộp báo cáo chi phí tháng 6/2023. Hạn cuối nộp báo cáo là ngày 10/07/2023.',
      createdById: financeHead.id,
      isPublic: true
    }
  });

  const serviceUpdate = await prisma.notification.upsert({
    where: { id: 'notif-8' },
    update: {},
    create: {
      id: 'notif-8',
      title: 'Cập nhật quy trình hỗ trợ khách hàng',
      content: 'Thông báo về việc cập nhật quy trình hỗ trợ khách hàng từ ngày 15/07/2023. Chi tiết vui lòng xem tài liệu đính kèm.',
      createdById: customerServiceHead.id,
      departmentId: customerService.id,
      isPublic: false
    }
  });

  const productLaunch = await prisma.notification.upsert({
    where: { id: 'notif-9' },
    update: {},
    create: {
      id: 'notif-9',
      title: 'Ra mắt sản phẩm XYZ phiên bản 2.0',
      content: 'Thông báo về việc ra mắt sản phẩm XYZ phiên bản 2.0 vào ngày 01/08/2023. Mời các bạn tham dự sự kiện ra mắt.',
      createdById: productHead.id,
      isPublic: true
    }
  });

  const hrRecruitment = await prisma.notification.upsert({
    where: { id: 'notif-10' },
    update: {},
    create: {
      id: 'notif-10',
      title: 'Thông báo tuyển dụng nội bộ',
      content: 'Thông báo về các vị trí tuyển dụng nội bộ mới. Nhân viên quan tâm vui lòng liên hệ phòng Nhân sự.',
      createdById: hrHead.id,
      isPublic: true
    }
  });

  const trainingNotification = await prisma.notification.upsert({
    where: { id: 'notif-11' },
    update: {},
    create: {
      id: 'notif-11',
      title: 'Đăng ký khóa đào tạo Kỹ năng Quản lý',
      content: 'Thông báo về khóa đào tạo Kỹ năng Quản lý cho cấp quản lý trung vào ngày 20/07/2023. Hạn đăng ký: 15/07/2023.',
      createdById: hrHead.id,
      isPublic: true
    }
  });

  const marketingDeadline = await prisma.notification.upsert({
    where: { id: 'notif-12' },
    update: {},
    create: {
      id: 'notif-12',
      title: 'Deadline nộp kế hoạch Marketing Q3/2023',
      content: 'Thông báo deadline nộp kế hoạch Marketing Q3/2023 là ngày 10/07/2023. Vui lòng gửi kế hoạch cho Trưởng phòng Marketing.',
      createdById: marketingHead.id,
      departmentId: marketing.id,
      isPublic: false
    }
  });

  const legalUpdate = await prisma.notification.upsert({
    where: { id: 'notif-13' },
    update: {},
    create: {
      id: 'notif-13',
      title: 'Cập nhật quy định pháp luật về bảo vệ dữ liệu',
      content: 'Thông báo về việc cập nhật quy định pháp luật mới về bảo vệ dữ liệu có hiệu lực từ ngày 01/08/2023.',
      createdById: legalHead.id,
      isPublic: true
    }
  });

  const salesReport2 = await prisma.notification.upsert({
    where: { id: 'notif-14' },
    update: {},
    create: {
      id: 'notif-14',
      title: 'Deadline báo cáo bán hàng tháng 06/2023',
      content: 'Thông báo deadline nộp báo cáo bán hàng tháng 06/2023 là ngày 07/07/2023. Vui lòng nộp báo cáo cho Trưởng phòng Kinh doanh.',
      createdById: salesHead.id,
      departmentId: sales.id,
      isPublic: false
    }
  });

  const qaReportDeadline = await prisma.notification.upsert({
    where: { id: 'notif-15' },
    update: {},
    create: {
      id: 'notif-15',
      title: 'Deadline báo cáo kiểm thử sản phẩm ABC',
      content: 'Thông báo deadline nộp báo cáo kiểm thử sản phẩm ABC là ngày 15/07/2023. Vui lòng nộp báo cáo cho Trưởng phòng KSCL.',
      createdById: qaHead.id,
      departmentId: qa.id,
      isPublic: false
    }
  });

  // Create missing notification objects
  const generalNotification = await prisma.notification.upsert({
    where: { id: 'notif-1' },
    update: {},
    create: {
      id: 'notif-1',
      title: 'Thông báo chung',
      content: 'Thông báo hệ thống đã được cập nhật lên phiên bản mới.',
      createdById: adminUser.id,
      isPublic: true
    }
  });

  const techNotification = await prisma.notification.upsert({
    where: { id: 'notif-2' },
    update: {},
    create: {
      id: 'notif-2',
      title: 'Thông báo kỹ thuật',
      content: 'Thông báo bảo trì hệ thống vào ngày 30/07/2023.',
      createdById: engineeringHead.id,
      departmentId: engineering.id,
      isPublic: false
    }
  });

  console.log({
    departments: { 
      engineering, marketing, hr, finance, 
      sales, customerService, qa, productDevelopment, legal, administration 
    },
    users: { 
      adminUser, 
      engineeringHead, marketingHead, hrHead, financeHead,
      salesHead, customerServiceHead, qaHead, productHead, legalHead, adminHead,
      engineeringEmployee1, engineeringEmployee2, engineeringEmployee3, engineeringEmployee4, engineeringEmployee5,
      marketingEmployee1, marketingEmployee2, marketingEmployee3, marketingEmployee4,
      hrEmployee1, hrEmployee2, hrEmployee3,
      financeEmployee1, financeEmployee2, financeEmployee3,
      salesEmployee1, salesEmployee2,
      csEmployee1, csEmployee2,
      qaEmployee1, qaEmployee2
    },
    posts: { 
      welcomePost, engineeringPost, marketingPost, pendingPost, rejectedPost,
      salesPost, qaPost, productPost, financePost, servicePost, legalPost, hrPost, adminPost,
      engineeringPost2, marketingPost2, employeePost1, employeePost2, employeePost3, employeePost4, employeePost5
    },
    documents: { 
      technicalDoc, marketingReport, contractTemplate, pendingDocument, rejectedDocument,
      productRequirements, marketingGuidelines, salesReport, qaTestPlan, legalContract,
      engineeringArchitecture, financePolicy, hrHandbook, csHandbook, adminProcedure,
      productRoadmap, salesTraining, techStandards, marketingBudget, hrRecruitmentPlan
    },
    comments: {
      commentOnRejectedDoc, commentOnRejectedPost, commentOnPendingDoc, commentOnPendingPost,
      commentOnProductRoadmap, commentOnMarketingPost, commentOnEmployeePost, commentOnProductPost,
      commentOnSalesPromotion, commentOnMarketingPost2
    },
    events: { 
      companyEvent, techMeeting, hrTraining, marketingWorkshop, productDemo,
      salesTrainingEvent, teamBuilding, techTalk, financeWorkshop, customerFeedbackWorkshop,
      productPlanning, legalWorkshop
    },
    notifications: { 
      generalNotification, techNotification, vacationNotification, securityUpdate,
      officeClosureNotification, engineeringDeployment, financeDeadline, serviceUpdate,
      productLaunch, hrRecruitment, trainingNotification, marketingDeadline,
      legalUpdate, salesReport2, qaReportDeadline
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 