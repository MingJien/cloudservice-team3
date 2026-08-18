"use client";

import { useState } from "react";
import Link from "next/link";

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6; // Số bài viết hiển thị trên mỗi trang (có thể chỉnh lại số lượng theo ý muốn)

  const posts = [
  { id: 1, title: "Top 5 xu hướng Cloud Computing đáng chú ý nhất trong năm nay", excerpt: "Khám phá các công nghệ đám mây mới nhất giúp doanh nghiệp tối ưu chi phí...", category: "Cloud Computing", date: "12 Tháng 6, 2026", readTime: "5 phút đọc", imageGradient: "from-blue-500 to-indigo-600" },
  { id: 2, title: "Hướng dẫn cấu hình Firewall bảo mật VPS Linux chống DDoS", excerpt: "Các bước cơ bản và nâng cao để thiết lập UFW, Fail2ban nhằm bảo vệ máy chủ...", category: "Bảo mật", date: "08 Tháng 6, 2026", readTime: "7 phút đọc", imageGradient: "from-indigo-500 to-purple-600" },
  { id: 3, title: "So sánh ổ cứng NVMe SSD và SATA SSD cho Database", excerpt: "Phân tích chi tiết hiệu năng đọc/ghi IOPS giữa NVMe và SATA SSD...", category: "Hạ tầng", date: "01 Tháng 6, 2026", readTime: "4 phút đọc", imageGradient: "from-violet-500 to-blue-600" },
  { id: 4, title: "Bảo mật SSH: Cách vô hiệu hóa đăng nhập bằng mật khẩu", excerpt: "Hướng dẫn thiết lập khóa SSH (SSH Key) để ngăn chặn tấn công Brute Force...", category: "Bảo mật", date: "15 Tháng 7, 2026", readTime: "6 phút đọc", imageGradient: "from-rose-500 to-red-600" },
  { id: 5, title: "Tối ưu hóa Kernel Linux cho máy chủ chịu tải cao", excerpt: "Cấu hình sysctl để tinh chỉnh các tham số mạng cho hiệu năng tối đa...", category: "Hạ tầng", date: "20 Tháng 7, 2026", readTime: "8 phút đọc", imageGradient: "from-emerald-500 to-teal-600" },
  { id: 6, title: "Triển khai SSL/TLS tự động với Certbot trên Nginx", excerpt: "Bảo mật dữ liệu bằng chứng chỉ SSL miễn phí từ Let's Encrypt...", category: "Bảo mật", date: "05 Tháng 8, 2026", readTime: "4 phút đọc", imageGradient: "from-amber-500 to-orange-600" },
  // 26 bài viết mới
  { id: 7, title: "Cơ bản về Serverless Architecture", excerpt: "Hướng dẫn chi tiết về kiến trúc không máy chủ cho kỹ sư hệ thống.", category: "Cloud Computing", date: "4 Tháng 2, 2026", readTime: "6 phút đọc", imageGradient: "from-violet-500 to-purple-600" },
  { id: 8, title: "IAM Best Practices: Quản lý quyền truy cập", excerpt: "Tối ưu hóa bảo mật hệ thống với quản lý danh tính và quyền truy cập.", category: "Bảo mật", date: "19 Tháng 1, 2026", readTime: "13 phút đọc", imageGradient: "from-violet-500 to-emerald-600" },
  { id: 9, title: "Chiến lược High Availability cho hệ thống lớn", excerpt: "Đảm bảo dịch vụ luôn hoạt động ổn định với cấu trúc HA.", category: "Hạ tầng", date: "18 Tháng 7, 2026", readTime: "11 phút đọc", imageGradient: "from-indigo-500 to-amber-600" },
  { id: 10, title: "Firewall Configuration: Bảo mật từ gốc", excerpt: "Thiết lập tường lửa an toàn cho hạ tầng cloud doanh nghiệp.", category: "Bảo mật", date: "15 Tháng 3, 2026", readTime: "7 phút đọc", imageGradient: "from-purple-500 to-indigo-600" },
  { id: 11, title: "Zero Trust Architecture: Xu hướng bảo mật mới", excerpt: "Tại sao Zero Trust là tương lai của bảo mật hạ tầng cloud.", category: "Bảo mật", date: "18 Tháng 6, 2026", readTime: "10 phút đọc", imageGradient: "from-rose-500 to-blue-600" },
  { id: 12, title: "Tăng cường IAM trong môi trường Cloud", excerpt: "Các chiến lược thực tế về quản lý danh tính và truy cập (IAM).", category: "Bảo mật", date: "15 Tháng 5, 2026", readTime: "4 phút đọc", imageGradient: "from-blue-500 to-indigo-600" },
  { id: 13, title: "Triển khai Zero Trust hiệu quả", excerpt: "Quy trình từng bước để áp dụng mô hình Zero Trust cho doanh nghiệp.", category: "Bảo mật", date: "13 Tháng 1, 2026", readTime: "7 phút đọc", imageGradient: "from-indigo-500 to-emerald-600" },
  { id: 14, title: "Phân tích bảo mật với IAM", excerpt: "Sử dụng IAM để phát hiện và ngăn chặn các lỗ hổng bảo mật.", category: "Bảo mật", date: "9 Tháng 6, 2026", readTime: "14 phút đọc", imageGradient: "from-purple-500 to-amber-600" },
  { id: 15, title: "Load Balancing: Cân bằng tải hiệu năng cao", excerpt: "Tối ưu hóa phân phối lưu lượng cho website chịu tải lớn.", category: "Hạ tầng", date: "4 Tháng 3, 2026", readTime: "8 phút đọc", imageGradient: "from-purple-500 to-indigo-600" },
  { id: 16, title: "Zero Trust cho người bắt đầu", excerpt: "Kiến thức nền tảng về mô hình bảo mật Zero Trust.", category: "Bảo mật", date: "26 Tháng 8, 2026", readTime: "5 phút đọc", imageGradient: "from-indigo-500 to-amber-600" },
  { id: 17, title: "Tối ưu Database Indexing cho truy vấn nhanh", excerpt: "Các kỹ thuật đánh chỉ mục (index) giúp tăng tốc database.", category: "Hạ tầng", date: "15 Tháng 2, 2026", readTime: "12 phút đọc", imageGradient: "from-amber-500 to-emerald-600" },
  { id: 18, title: "Xu hướng mới trong quản lý IAM", excerpt: "Cập nhật các công nghệ mới nhất trong lĩnh vực quản lý IAM.", category: "Bảo mật", date: "10 Tháng 6, 2026", readTime: "7 phút đọc", imageGradient: "from-indigo-500 to-purple-600" },
  { id: 19, title: "DDoS Mitigation: Chống tấn công mạng", excerpt: "Giải pháp toàn diện giúp doanh nghiệp chặn đứng các cuộc tấn công DDoS.", category: "Bảo mật", date: "26 Tháng 5, 2026", readTime: "5 phút đọc", imageGradient: "from-violet-500 to-blue-600" },
  { id: 20, title: "Infrastructure as Code (IaC) cơ bản", excerpt: "Tự động hóa quản lý hạ tầng bằng mã nguồn (IaC).", category: "Hạ tầng", date: "26 Tháng 6, 2026", readTime: "3 phút đọc", imageGradient: "from-amber-500 to-violet-600" },
  { id: 21, title: "Container Orchestration với Kubernetes", excerpt: "Hướng dẫn điều phối container cho hệ thống microservices.", category: "Hạ tầng", date: "7 Tháng 1, 2026", readTime: "9 phút đọc", imageGradient: "from-indigo-500 to-amber-600" },
  { id: 22, title: "Phân tích sâu về Infrastructure as Code", excerpt: "So sánh các công cụ IaC phổ biến như Terraform và Ansible.", category: "Hạ tầng", date: "28 Tháng 1, 2026", readTime: "4 phút đọc", imageGradient: "from-blue-500 to-emerald-600" },
  { id: 23, title: "Xây dựng chiến lược Multi-cloud", excerpt: "Tận dụng lợi thế của nhiều nhà cung cấp đám mây.", category: "Cloud Computing", date: "25 Tháng 6, 2026", readTime: "7 phút đọc", imageGradient: "from-purple-500 to-purple-600" },
  { id: 24, title: "Tối ưu hóa độ trễ mạng (Network Latency)", excerpt: "Các mẹo nhỏ giúp giảm độ trễ cho kết nối cloud.", category: "Hạ tầng", date: "24 Tháng 6, 2026", readTime: "9 phút đọc", imageGradient: "from-indigo-500 to-emerald-600" },
  { id: 25, title: "Triển khai thực tế IAM cho đội ngũ", excerpt: "Lộ trình triển khai hệ thống IAM cho tổ chức doanh nghiệp.", category: "Bảo mật", date: "14 Tháng 7, 2026", readTime: "14 phút đọc", imageGradient: "from-emerald-500 to-indigo-600" },
  { id: 26, title: "Xu hướng Cloud Migration 2026", excerpt: "Làm thế nào để chuyển đổi hệ thống cũ lên đám mây thành công.", category: "Cloud Computing", date: "2 Tháng 8, 2026", readTime: "15 phút đọc", imageGradient: "from-rose-500 to-rose-600" },
  { id: 27, title: "Vulnerability Assessment: Kiểm tra lỗ hổng", excerpt: "Định kỳ đánh giá lỗ hổng bảo mật cho hệ thống máy chủ.", category: "Bảo mật", date: "27 Tháng 8, 2026", readTime: "5 phút đọc", imageGradient: "from-emerald-500 to-blue-600" },
  { id: 28, title: "Quy trình Vulnerability Assessment chuyên sâu", excerpt: "Cách thực hiện kiểm thử bảo mật nâng cao.", category: "Bảo mật", date: "10 Tháng 5, 2026", readTime: "11 phút đọc", imageGradient: "from-blue-500 to-amber-600" },
  { id: 29, title: "So sánh các giải pháp IAM hàng đầu", excerpt: "Đánh giá các giải pháp IAM phổ biến trên thị trường hiện nay.", category: "Bảo mật", date: "5 Tháng 6, 2026", readTime: "7 phút đọc", imageGradient: "from-indigo-500 to-emerald-600" },
  { id: 30, title: "So sánh mô hình Zero Trust", excerpt: "Các mô hình Zero Trust khác nhau và cách chọn lựa.", category: "Bảo mật", date: "3 Tháng 6, 2026", readTime: "13 phút đọc", imageGradient: "from-amber-500 to-blue-600" },
  { id: 31, title: "Edge Computing: Tương lai của Cloud", excerpt: "Tối ưu hóa trải nghiệm người dùng với Edge Computing.", category: "Cloud Computing", date: "1 Tháng 7, 2026", readTime: "5 phút đọc", imageGradient: "from-emerald-500 to-rose-600" },
  { id: 32, title: "Cloud Migration: Những thách thức lớn", excerpt: "Cách xử lý các vấn đề thường gặp khi di chuyển lên cloud.", category: "Cloud Computing", date: "4 Tháng 7, 2026", readTime: "5 phút đọc", imageGradient: "from-violet-500 to-emerald-600" },
];
  // Lọc bài viết theo danh mục và từ khóa tìm kiếm
  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === "Tất cả" || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage) || 1;
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/40 to-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Tiêu đề trang */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl mb-3">
            Blog & <span className="text-indigo-600">Kiến thức Cloud</span>
          </h1>
          <p className="text-base text-gray-600 leading-relaxed">
            Cập nhật các xu hướng công nghệ mới nhất, hướng dẫn kỹ thuật chuyên sâu và kinh nghiệm quản trị hạ tầng server thực chiến.
          </p>
        </div>

        {/* Thanh tìm kiếm (Search Bar) */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm bài viết theo tiêu đề hoặc nội dung..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Tự động về trang 1 khi gõ tìm kiếm
              }}
              className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3.5 pl-12 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        {/* Thanh lọc danh mục */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {["Tất cả", "Cloud Computing", "Bảo mật", "Hạ tầng"].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1); // Tự động về trang 1 khi đổi danh mục
              }}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 font-semibold"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200/80"
              }`}
            >
              {cat === "Tất cả" ? "Tất cả bài viết" : cat}
            </button>
          ))}
        </div>

        {/* Lưới danh sách bài viết */}
        {currentPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {currentPosts.map((post) => (
              <Link 
                key={post.id}
                href={`/blog/${post.id}`}
                className="group bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50/60 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-200/80 cursor-pointer"
              >
                <div>
                  <div className="overflow-hidden relative h-48 w-full">
                    <div className={`absolute inset-0 bg-gradient-to-r ${post.imageGradient} p-6 flex flex-col justify-between transition-transform duration-500 group-hover:scale-110`}>
                      <span className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                        {post.category}
                      </span>
                      <div className="text-white/90 text-xs font-medium self-start bg-black/15 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                        {post.date} • {post.readTime}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <span className="inline-flex items-center gap-2 text-indigo-600 font-semibold text-sm group-hover:text-indigo-700 transition-colors">
                    <span>Đọc bài viết</span>
                    <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/50 backdrop-blur-md rounded-3xl border border-dashed border-gray-300 mb-12">
            <p className="text-gray-500 text-base">Không tìm thấy bài viết phù hợp với từ khóa hoặc danh mục đã chọn.</p>
          </div>
        )}

        {/* Hệ thống phân trang (Pagination) */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Trang trước
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                  currentPage === page
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}