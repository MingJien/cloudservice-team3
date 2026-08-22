import type { Metadata } from "next";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { BrandProvider } from "@/components/brand/brand-provider";

export const metadata: Metadata = {
  title: { default: "MekongNode | Dịch vụ cloud", template: "%s | MekongNode" },
  description: "Đồ án nền tảng Cloud/VPS: so sánh cấu hình, tính giá tại API và theo dõi yêu cầu bằng mã tra cứu.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <ThemeProvider><BrandProvider>{children}</BrandProvider></ThemeProvider>
      </body>
    </html>
  );
}
