export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/40 to-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Tiêu đề trang */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl mb-3">
            Giới thiệu về <span className="text-indigo-600">MekongNode</span>
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Tiên phong cung cấp hạ tầng Cloud mạnh mẽ, ổn định và tối ưu chi phí, đồng hành cùng sự bứt phá số hóa của doanh nghiệp Việt.
          </p>
        </div>

        {/* Các khối nội dung màu trắng nổi bật trên nền trắng xanh nhạt */}
        <div className="space-y-8">
          {/* Khối 1: Lịch sử hình thành */}
          <div className="bg-white/90 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50/60 transition-all">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
              Lịch sử hình thành & Tầm nhìn chiến lược
            </h2>
            <div className="space-y-3 text-gray-600 leading-relaxed text-sm">
              <p>
                Được thành lập vào giai đoạn chuyển đổi số diễn ra mạnh mẽ, <strong>MekongNode</strong> ra đời với sứ mệnh đơn giản hóa việc quản trị hạ tầng công nghệ phức tạp. Chúng tôi thấu hiểu rằng đối với các doanh nghiệp vừa và nhỏ cũng như các lập trình viên, việc sở hữu một hệ thống máy chủ ổn định, bảo mật và linh hoạt là chìa khóa then chốt dẫn đến thành công.
              </p>
              <p>
                Trải qua quá trình không ngừng nghiên cứu và phát triển, MekongNode đã từng bước khẳng định vị thế, mở rộng quy mô hệ thống để cung cấp các giải pháp máy chủ ảo (VPS), Cloud Server, Kubernetes cùng các dịch vụ lưu trữ dữ liệu với chất lượng vượt trội. Kim chỉ nam trong mọi hoạt động của chúng tôi là luôn đặt sự an toàn và ổn định của hệ thống khách hàng lên hàng đầu.
              </p>
            </div>
          </div>

          {/* Khối 2: Datacenter (Trung tâm dữ liệu) */}
          <div className="bg-white/90 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50/60 transition-all">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
              Hệ thống Trung tâm dữ liệu (Datacenter) hiện đại
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm mb-6">
              Để đảm bảo hiệu năng vận hành mượt mà và giảm thiểu tối đa độ trễ (latency) cho người dùng tại Việt Nam và khu vực Đông Nam Á, toàn bộ hệ thống của chúng tôi được đặt tại các trung tâm dữ liệu đạt tiêu chuẩn quốc tế Tier 3. Hạ tầng phần cứng được đầu tư đồng bộ hoàn toàn từ các thương hiệu hàng đầu thế giới như Intel, AMD, kết hợp hệ thống ổ cứng Enterprise SSD NVMe tốc độ cực cao, giúp xử lý hàng triệu truy vấn mỗi giây mà không gặp hiện tượng nghẽn cổ chai.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-indigo-50/50 to-white p-5 rounded-2xl border border-indigo-100/60 text-center">
                <div className="text-indigo-600 font-extrabold text-2xl mb-1">99.9%</div>
                <div className="text-xs text-gray-600 font-bold uppercase tracking-wider">Cam kết Uptime</div>
                <p className="text-xs text-gray-400 mt-1">Vận hành xuyên suốt</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50/50 to-white p-5 rounded-2xl border border-indigo-100/60 text-center">
                <div className="text-indigo-600 font-extrabold text-2xl mb-1">24/7/365</div>
                <div className="text-xs text-gray-600 font-bold uppercase tracking-wider">Hỗ trợ kỹ thuật</div>
                <p className="text-xs text-gray-400 mt-1">Túc trực xử lý sự cố</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50/50 to-white p-5 rounded-2xl border border-indigo-100/60 text-center">
                <div className="text-indigo-600 font-extrabold text-2xl mb-1">10 Gbps</div>
                <div className="text-xs text-gray-600 font-bold uppercase tracking-wider">Băng thông cao</div>
                <p className="text-xs text-gray-400 mt-1">Đường truyền mạnh mẽ</p>
              </div>
            </div>
          </div>

          {/* Khối 3: Cam kết SLA */}
          <div className="bg-white/90 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50/60 transition-all">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
              Cam kết chất lượng dịch vụ (SLA) & Quyền lợi khách hàng
            </h2>
            <div className="space-y-3 text-gray-600 leading-relaxed text-sm">
              <p>
                Chúng tôi hiểu rằng thời gian downtime của hệ thống đồng nghĩa với tổn thất kinh tế của doanh nghiệp. Vì vậy, MekongNode đưa ra chính sách cam kết mức độ dịch vụ (SLA) rõ ràng và minh bạch. 
              </p>
              <p>
                Chúng tôi cam kết hoàn tiền và bồi thường thỏa đáng theo đúng thỏa thuận SLA nếu hạ tầng gặp sự cố ngoài ý muốn bắt nguồn từ lỗi hệ thống phía nhà cung cấp. Sự an tâm, tín nhiệm và trải nghiệm mượt mà của quý khách hàng chính là thước đo thành công bền vững của chúng tôi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}