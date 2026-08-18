import Link from "next/link";

export default function ServicesPage() {
  const services = [
    {
      id: "cloud-server",
      title: "Cloud Server NVMe",
      tagline: "Máy chủ ảo hiệu năng cao, linh hoạt và ổn định tuyệt đối",
      description: "Sử dụng 100% ổ cứng Enterprise NVMe SSD kết hợp chip Intel/AMD đời mới, đáp ứng hoàn hảo cho website doanh nghiệp, ứng dụng web nặng.",
      price: "Từ 150.000 đ / tháng",
      features: ["Uptime cam kết 99.9%", "Băng thông không giới hạn", "Sao lưu dữ liệu tự động hàng tuần"],
      imageGradient: "from-blue-600 to-indigo-600"
    },
    {
      id: "kubernetes-engine",
      title: "Mekong Kubernetes Engine",
      tagline: "Tự động hóa triển khai ứng dụng Microservices",
      description: "Giải pháp quản lý cụm container tối ưu, giúp doanh nghiệp dễ dàng scale-up hệ thống tự động mà không lo gián đoạn dịch vụ.",
      price: "Từ 500.000 đ / tháng",
      features: ["Tự động cân bằng tải", "Triển khai CI/CD dễ dàng", "Hỗ trợ kỹ thuật 24/7 từ chuyên gia"],
      imageGradient: "from-indigo-600 to-purple-600"
    },
    {
      id: "managed-database",
      title: "Managed Database",
      tagline: "Hệ quản trị cơ sở dữ liệu tốc độ cao, an toàn tuyệt đối",
      description: "Hỗ trợ tối ưu cho MySQL, PostgreSQL, MongoDB với cấu hình phần cứng chuyên biệt, bảo mật nhiều lớp và chống tấn công tối ưu.",
      price: "Từ 300.000 đ / tháng",
      features: ["Tối ưu hóa chỉ mục tự động", "Bảo mật tường lửa riêng biệt", "Khôi phục dữ liệu nhanh chóng"],
      imageGradient: "from-violet-600 to-blue-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/40 to-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl mb-3">
            Hạ tầng & <span className="text-indigo-600">Dịch vụ Cloud</span>
          </h1>
          <p className="text-base text-gray-600 leading-relaxed">
            Khám phá các giải pháp máy chủ và điện toán đám mây toàn diện, được thiết kế riêng để tối ưu hóa tốc độ và chi phí cho doanh nghiệp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((item) => (
            <Link
              key={item.id}
              href={`/services/${item.id}`}
              className="group bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50/60 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-200/80 cursor-pointer"
            >
              <div>
                <div className={`h-40 w-full bg-gradient-to-r ${item.imageGradient} p-6 flex flex-col justify-between transition-transform duration-500 group-hover:scale-105`}>
                  <span className="self-start bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                    MekongNode Cloud
                  </span>
                  <div className="text-white font-bold text-lg">{item.price}</div>
                </div>

                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h2>
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-3">
                    {item.tagline}
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {item.description}
                  </p>

                  <ul className="space-y-2 border-t border-gray-100 pt-4">
                    {item.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-6 pt-0">
                <span className="inline-flex items-center gap-2 text-indigo-600 font-semibold text-sm group-hover:text-indigo-700 transition-colors">
                  <span>Xem chi tiết & Cấu hình</span>
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}