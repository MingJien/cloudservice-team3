import Link from "next/link";

// Dữ liệu chi tiết cho từng dịch vụ
const serviceDetails: Record<string, { title: string; tagline: string; description: string; price: string; specs: string[]; benefits: string[]; imageGradient: string }> = {
  "cloud-server": {
    title: "Cloud Server NVMe",
    tagline: "Máy chủ ảo hiệu năng cao, linh hoạt và ổn định tuyệt đối",
    description: "MekongNode Cloud Server sử dụng 100% ổ cứng NVMe Enterprise thế hệ mới kết hợp vi xử lý tốc độ cao, mang lại hiệu năng vượt trội cho mọi hệ thống từ website thương mại điện tử đến các ứng dụng enterprise phức tạp.",
    price: "Từ 150.000 đ / tháng",
    specs: [
      "CPU: Intel Xeon / AMD EPYC hiệu năng cao",
      "RAM: Tùy chọn từ 2GB đến 128GB ECC",
      "Storage: 100% NVMe Enterprise SSD siêu tốc",
      "Băng thông: Đường truyền quốc tế tốc độ cao lên tới 10 Gbps"
    ],
    benefits: [
      "Khởi tạo hệ thống tự động chỉ trong vòng 45 giây.",
      "Toàn quyền quản trị (Full Root Access) với hệ điều hành tự chọn.",
      "Cam kết chất lượng dịch vụ Uptime 99.9%."
    ],
    imageGradient: "from-blue-600 to-indigo-600"
  },
  "kubernetes-engine": {
    title: "Mekong Kubernetes Engine",
    tagline: "Tự động hóa triển khai ứng dụng Microservices",
    description: "Nền tảng quản lý cụm container được tối ưu hóa sẵn, giúp đội ngũ kỹ thuật của bạn tập trung phát triển sản phẩm mà không cần lo lắng về việc vận hành hạ tầng phức tạp bên dưới.",
    price: "Từ 500.000 đ / tháng",
    specs: [
      "Hỗ trợ các phiên bản Kubernetes mới nhất",
      "Tích hợp sẵn Load Balancer và Persistent Storage",
      "Quản lý cụm node linh hoạt, scale-up tự động",
      "Bảo mật mạng container cô lập an toàn"
    ],
    benefits: [
      "Giảm thiểu tối đa thời gian downtime khi cập nhật ứng dụng.",
      "Tự động phục hồi pod khi xảy ra sự cố phần cứng.",
      "Hỗ trợ kỹ thuật chuyên sâu trực tiếp từ các chuyên gia DevOps."
    ],
    imageGradient: "from-indigo-600 to-purple-600"
  },
  "managed-database": {
    title: "Managed Database",
    tagline: "Hệ quản trị cơ sở dữ liệu tốc độ cao, an toàn tuyệt đối",
    description: "Dịch vụ cơ sở dữ liệu quản trị sẵn giúp bảo vệ dữ liệu tối đa, tự động sao lưu định kỳ và tối ưu hóa hiệu năng truy vấn cho các hệ thống có lượng truy cập lớn.",
    price: "Từ 300.000 đ / tháng",
    specs: [
      "Hỗ trợ MySQL, PostgreSQL, Redis, MongoDB",
      "Cấu hình Master-Slave sẵn sàng chuyển đổi dự phòng",
      "Tự động sao lưu dữ liệu hàng ngày (Daily Backup)",
      "Giám sát hiệu năng và cảnh báo lỗi theo thời gian thực"
    ],
    benefits: [
      "Loại bỏ hoàn toàn rủi ro mất mát dữ liệu nhờ hệ thống backup tự động.",
      "Tối ưu hóa câu lệnh truy vấn giúp tăng tốc độ phản hồi website.",
      "Bảo mật tuyệt đối với tường lửa và mã hóa đường truyền."
    ],
    imageGradient: "from-violet-600 to-blue-600"
  }
};

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const service = serviceDetails[resolvedParams.id] || {
    title: "Dịch vụ không tồn tại",
    tagline: "Thông tin không khả dụng",
    description: "Dịch vụ bạn đang tìm kiếm không tồn tại hoặc đã được cập nhật.",
    price: "Liên hệ",
    specs: [],
    benefits: [],
    imageGradient: "from-gray-500 to-slate-600"
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/40 to-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Nút quay lại danh sách dịch vụ */}
        <Link 
          href="/services" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 mb-8 transition-colors"
        >
          <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
          </svg>
          <span>Quay lại danh sách dịch vụ</span>
        </Link>

        {/* Khung nội dung chi tiết */}
        <article className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50/60 overflow-hidden">
          {/* Banner */}
          <div className={`h-64 sm:h-72 w-full bg-gradient-to-r ${service.imageGradient} p-8 sm:p-10 flex flex-col justify-end relative`}>
            <span className="absolute top-6 left-6 bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              MekongNode Service
            </span>
            <div className="text-indigo-100 font-bold text-xl mb-2">{service.price}</div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-snug">
              {service.title}
            </h1>
            <p className="text-white/90 text-sm mt-1 font-medium">{service.tagline}</p>
          </div>

          {/* Nội dung chi tiết cấu hình và lợi ích */}
          <div className="p-8 sm:p-12 space-y-8">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Tổng quan dịch vụ</h2>
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{service.description}</p>
            </div>

            {service.specs.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Thông số kỹ thuật nổi bật</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {service.specs.map((spec, index) => (
                    <div key={index} className="bg-indigo-50/50 border border-indigo-100/60 p-4 rounded-2xl text-xs sm:text-sm text-gray-700 font-medium flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {service.benefits.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Lợi ích khi lựa chọn MekongNode</h2>
                <div className="space-y-3">
                  {service.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nút hành động đăng ký */}
            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm text-gray-500 font-medium">Bạn cần tư vấn cấu hình riêng theo yêu cầu dự án?</span>
              <Link 
                href="/contact" 
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold py-3 px-8 rounded-2xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg shadow-indigo-200 text-center text-sm"
              >
                Liên hệ tư vấn ngay
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}