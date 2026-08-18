import Link from "next/link";

// Dữ liệu mẫu chi tiết cho các bài viết (Thực tế bạn có thể gọi API dựa vào ID)
const articles: Record<string, { title: string; category: string; date: string; readTime: string; content: string[]; imageGradient: string }> = {
  "1": {
    title: "Top 5 xu hướng Cloud Computing đáng chú ý nhất trong năm nay",
    category: "Cloud Computing",
    date: "12 Tháng 6, 2026",
    readTime: "5 phút đọc",
    imageGradient: "from-blue-500 to-indigo-600",
    content: [
      "Trong bối cảnh chuyển đổi số diễn ra mạnh mẽ, điện toán đám mây (Cloud Computing) tiếp tục đóng vai trò là xương sống cho mọi hoạt động công nghệ của doanh nghiệp. Dưới đây là 5 xu hướng lớn nhất đang định hình lại ngành công nghệ đám mây năm nay.",
      "1. Sự bùng nổ của AI và Machine Learning tích hợp sẵn trên Cloud: Các nhà cung cấp dịch vụ đám mây lớn ngày càng đơn giản hóa việc triển khai các mô hình AI trực tiếp thông qua hạ tầng GPU hiệu năng cao.",
      "2. Kiến trúc Serverless và Microservices: Giúp các lập trình viên tập trung hoàn toàn vào việc phát triển mã nguồn mà không cần bận tâm đến việc quản lý máy chủ hay cấu hình phần cứng phức tạp.",
      "3. Bảo mật đa lớp và Zero Trust: An ninh mạng trên đám mây được thắt chặt hơn bao giờ hết với các công nghệ mã hóa tiên tiến và kiểm soát quyền truy cập nghiêm ngặt theo thời gian thực."
    ]
  },
  "2": {
    title: "Hướng dẫn cấu hình Firewall bảo mật VPS Linux chống DDoS hiệu quả",
    category: "Bảo mật",
    date: "08 Tháng 6, 2026",
    readTime: "7 phút đọc",
    imageGradient: "from-indigo-500 to-purple-600",
    content: [
      "Bảo mật máy chủ ảo (VPS) là bước quan trọng đầu tiên khi bạn đưa bất kỳ website hoặc ứng dụng nào lên môi trường sản xuất (production). Bài viết này sẽ hướng dẫn bạn các bước thiết lập tường lửa cơ bản nhưng cực kỳ hiệu quả trên hệ điều hành Linux.",
      "Bước 1: Cấu hình cơ bản với UFW (Uncomplicated Firewall). UFW là công cụ quản lý iptables thân thiện nhất cho người dùng Ubuntu/Debian.",
      "Bước 2: Cài đặt Fail2ban để ngăn chặn các cuộc tấn công brute-force nhắm vào cổng SSH hoặc trang đăng nhập quản trị của website.",
      "Luôn nhớ vô hiệu hóa quyền đăng nhập SSH bằng tài khoản root trực tiếp và chuyển sang sử dụng khóa SSH Key (SSH Key Pair) để đạt mức độ bảo mật cao nhất."
    ]
  },
  "3": {
    title: "So sánh ổ cứng NVMe SSD và SATA SSD: Đâu là lựa chọn tối ưu cho Database?",
    category: "Hạ tầng",
    date: "01 Tháng 6, 2026",
    readTime: "4 phút đọc",
    imageGradient: "from-violet-500 to-blue-600",
    content: [
      "Khi vận hành các hệ thống cơ sở dữ liệu lớn như MySQL, PostgreSQL hay MongoDB, tốc độ đọc/ghi dữ liệu (IOPS) đóng vai trò quyết định đến hiệu năng toàn bộ hệ thống.",
      "Ổ cứng SATA SSD truyền thống với giao tiếp AHCI thường chỉ đạt tốc độ đọc/ghi tối đa khoảng 550 MB/s. Trong khi đó, ổ cứng NVMe SSD sử dụng giao tiếp PCIe tốc độ cao có thể đạt từ 3,500 MB/s đến hàng chục nghìn MB/s.",
      "Đối với các ứng dụng có lượng truy vấn đồng thời lớn, việc đầu tư hạ tầng sử dụng 100% ổ cứng NVMe SSD tại MekongNode sẽ giúp giảm thiểu tối đa thời gian chờ của câu lệnh truy vấn (Query latency)."
    ]
  }
};

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const post = articles[resolvedParams.id] || {
    title: "Bài viết không tồn tại",
    category: "Thông báo",
    date: "--",
    readTime: "--",
    imageGradient: "from-gray-500 to-slate-600",
    content: ["Nội dung bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ bỏ."]
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/40 to-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Nút quay lại trang blog */}
        <Link 
          href="/blog" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 mb-8 transition-colors"
        >
          <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
          </svg>
          <span>Quay lại danh sách bài viết</span>
        </Link>

        {/* Thẻ chứa chi tiết bài viết */}
        <article className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50/60 overflow-hidden">
          {/* Banner đầu bài viết */}
          <div className={`h-64 sm:h-80 w-full bg-gradient-to-r ${post.imageGradient} p-8 flex flex-col justify-end relative`}>
            <span className="absolute top-6 left-6 bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              {post.category}
            </span>
            <div className="text-white/90 text-xs font-medium mb-3">
              {post.date} • {post.readTime}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
              {post.title}
            </h1>
          </div>

          {/* Nội dung chi tiết */}
          <div className="p-8 sm:p-12 space-y-6 text-gray-700 leading-relaxed text-base">
            {post.content.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}