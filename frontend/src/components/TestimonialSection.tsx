// frontend/src/components/TestimonialSection.tsx

export default function TestimonialSection() {
  const testimonials = [
    {
      name: "Nguyễn Văn A",
      role: "CTO tại TechSolution",
      content: "Dịch vụ hạ tầng của MekongNode thực sự ổn định. Tốc độ truy cập rất tốt cho khách hàng tại miền Tây.",
    },
    {
      name: "Trần Thị B",
      role: "Quản lý hệ thống",
      content: "Tôi rất hài lòng với sự hỗ trợ nhiệt tình từ đội ngũ kỹ thuật. Giải pháp cloud rất linh hoạt.",
    },
    {
      name: "Lê Văn C",
      role: "Developer",
      content: "Hạ tầng của MekongNode giúp chúng tôi tối ưu hóa chi phí vận hành đáng kể.",
    }
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-12">
          Khách hàng nói về MekongNode
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="text-indigo-600 mb-4 text-4xl">"</div>
              <p className="text-gray-600 mb-6 min-h-[100px]">{t.content}</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{t.name}</h4>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}