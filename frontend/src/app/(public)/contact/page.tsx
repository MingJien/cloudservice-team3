export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Cột trái: Thông tin liên hệ & Form (chiếm 5 phần) */}
        <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between">
          <div>
            {/* Thông tin công ty phía trên */}
            <div className="space-y-4 mb-8 text-gray-600">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-indigo-600 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <p className="text-sm">783 Đường Phạm Hữu Lầu, Phường 6, Thành phố Cao Lãnh, Đồng Tháp</p>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                <p className="text-sm font-semibold text-gray-900">1900 12345</p>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <p className="text-sm text-gray-900">support@mekongnode.vn</p>
              </div>
            </div>

            <hr className="border-gray-200 mb-8" />

            {/* Form liên hệ */}
            <h2 className="text-xl font-bold text-gray-900 mb-6">Liên hệ với chúng tôi</h2>
            <form className="space-y-4">
              <div>
                <input 
                  type="text" 
                  placeholder="Họ và tên" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                />
              </div>
              <div>
                <input 
                  type="email" 
                  placeholder="Email" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                />
              </div>
              
              {/* Thêm trường Số điện thoại của khách hàng */}
              <div>
                <input 
                  type="tel" 
                  placeholder="Số điện thoại" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                />
              </div>

              <div>
                <textarea 
                  placeholder="Nội dung" 
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" 
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-200 hover:from-indigo-700 hover:to-indigo-800 transition-all"
              >
                Gửi liên hệ
              </button>
            </form>
          </div>
        </div>

        {/* Cột phải: Google Maps Thành phố Cao Lãnh (chiếm 7 phần) */}
        <div className="lg:col-span-7 bg-gray-100 min-h-[450px] lg:min-h-full">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d62740.09133464878!2d105.61439246187747!3d10.463999900000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x310a7f141208945b%3A0x6338f972049d5a7d!2zQ2FvIEzDbmgsIMSQ4buTbmcgVGjDoXAsIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1690000000000!5m2!1svi!2s" 
            width="100%" 
            height="100%" 
            style={{ border: 0, minHeight: "100%" }} 
            allowFullScreen={true} 
            loading="lazy"
            title="MekongNode Cao Lanh Map"
          ></iframe>
        </div>

      </div>
    </div>
  );
}