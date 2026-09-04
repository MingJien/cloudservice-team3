import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Cable, CheckCircle2, Code2, Cpu, Database, FileCheck2, LayoutDashboard, Network, Server, ShieldCheck, TestTube2, Workflow } from "lucide-react";
import { AboutStats } from "@/components/about/about-stats";
import { Container } from "@/components/layout/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const milestones = [
  { period: "Khảo sát", title: "Chốt bài toán Cloud/VPS tại Việt Nam", detail: "Nhóm phân tách nhu cầu xem dịch vụ, báo giá, đặt yêu cầu, theo dõi và vận hành nội dung thay vì dựng một landing page tĩnh." },
  { period: "Thiết kế", title: "Đưa quy tắc nghiệp vụ vào Domain", detail: "Giá, khuyến mãi, trạng thái đơn và affiliate được xử lý tại backend; giao diện không tự suy diễn kết quả thương mại." },
  { period: "Triển khai", title: "Tách bốn lớp và chuẩn hóa REST", detail: "Web API .NET 10, EF Core, SQL Server và Next.js trao đổi bằng DTO, phân trang và Problem Details." },
  { period: "Kiểm chứng", title: "Bổ sung test, health check và audit", detail: "Các invariant quan trọng được test; thao tác quản trị có vai trò, concurrency token và dấu vết thay đổi." },
] as const;

const referenceBadges = [
  { icon: ShieldCheck, title: "ISO/IEC 27001", state: "Chuẩn tham chiếu", detail: "Chưa công bố là chứng nhận của dự án" },
  { icon: FileCheck2, title: "SOC 2", state: "Hướng phát triển", detail: "Dùng để định hướng kiểm soát vận hành" },
  { icon: BadgeCheck, title: "SLA 99,9%", state: "Mục tiêu mô phỏng", detail: "Cần telemetry thật trước khi cam kết" },
] as const;

const workstreams = [
  { icon: Code2, label: "Luồng 01", title: "Domain & kiến trúc", detail: "Invariant nghiệp vụ, Clean Architecture, CQRS và hợp đồng giữa các lớp." },
  { icon: Database, label: "Luồng 02", title: "API & dữ liệu", detail: "REST, EF Core/SQL Server, migration, định giá và truy vết đơn hàng." },
  { icon: LayoutDashboard, label: "Luồng 03", title: "Public & trải nghiệm", detail: "Landing, danh mục, báo giá, tra cứu, Affiliate và responsive light/dark." },
  { icon: TestTube2, label: "Luồng 04", title: "Admin & kiểm chứng", detail: "RBAC, audit, dashboard, test tự động, health check và tài liệu bàn giao." },
] as const;

export default function AboutPage() {
  return (
    <main className="overflow-hidden bg-[linear-gradient(180deg,#f4fbff_0%,#ffffff_34%,#f7fbfe_100%)] text-[#07101f] transition-colors dark:bg-[linear-gradient(180deg,#07101f_0%,#091528_38%,#07101f_100%)] dark:text-white">
      <ScrollReveal as="section" className="relative border-b border-[#dcebf4] pb-16 pt-14 dark:border-white/[0.06] md:pb-20 md:pt-20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(8,115,184,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(8,115,184,.055)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)] dark:opacity-35" />
        <div className="pointer-events-none absolute -left-36 top-0 h-80 w-80 rounded-full bg-cyan-300/20 blur-[100px] dark:bg-cyan-400/10" />
        <Container className="relative">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(390px,.82fr)] lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#c7e3f3] bg-white/75 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#0873b8] shadow-sm dark:border-cyan-300/15 dark:bg-white/[0.05] dark:text-cyan-300"><Database size={14} /> Dự án Cloud có thể kiểm chứng</span>
              <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.06] tracking-[-0.05em] sm:text-5xl lg:text-[3.8rem]">Không chỉ bán một gói VPS.<br /><span className="bg-[linear-gradient(100deg,#066aa9,#00a9cc)] bg-clip-text text-transparent dark:bg-[linear-gradient(100deg,#67e8f9,#93c5fd)] dark:bg-clip-text">Mô phỏng trọn luồng vận hành.</span></h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">MekongNode là đồ án nhóm được xây như một hệ thống dịch vụ: khách xem cấu hình và giá có hiệu lực, gửi yêu cầu, nhận mã tra cứu; đội vận hành xử lý nội dung, đơn hàng và đối tác trên cùng một nguồn dữ liệu.</p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-[#17334d] dark:text-slate-200">
                {["Giá tính tại backend", "Trạng thái có truy vết", "Không giả dữ liệu vận hành"].map((item) => <span key={item} className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" />{item}</span>)}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[34rem]">
              <div className="absolute -inset-5 rounded-[2.4rem] bg-[radial-gradient(circle_at_60%_20%,rgba(34,211,238,.28),transparent_55%)] blur-xl" />
              <div className="relative overflow-hidden rounded-[1.8rem] border border-[#c7dfea] bg-[#061126] p-2 shadow-[0_32px_80px_-45px_rgba(7,64,103,.85)] dark:border-white/10">
                <Image src="/images/mekongnode-cloud-isometric.png" alt="Minh họa kiến trúc cloud MekongNode" width={768} height={620} priority className="aspect-[1.16/1] w-full rounded-[1.35rem] object-cover" />
                <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/12 bg-[#071426]/76 p-4 text-white shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-4"><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-cyan-300"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.9)]" /> Architecture map</span><span className="font-mono text-xs text-slate-300">NET10 / NEXT16</span></div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[0.68rem] font-semibold text-slate-200"><span className="rounded-lg bg-white/[0.07] px-2 py-2">Public API</span><span className="rounded-lg bg-white/[0.07] px-2 py-2">Admin RBAC</span><span className="rounded-lg bg-white/[0.07] px-2 py-2">SQL + Audit</span></div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-14"><AboutStats /></div>
        </Container>
      </ScrollReveal>

      <ScrollReveal as="section" className="py-16 md:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[.82fr_1.18fr] lg:gap-20">
            <div className="lg:sticky lg:top-36 lg:self-start">
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#0873b8] dark:text-cyan-300">Hành trình kỹ thuật</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Bốn bước từ đề bài đến hệ thống chạy được</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">Timeline tập trung vào quyết định có thể giải thích khi bảo vệ: tại sao cần invariant, tại sao API phải phân trang và tại sao dữ liệu marketing không được tách khỏi dữ liệu vận hành.</p>
            </div>
            <ol className="relative border-l border-[#c9e1ef] pl-7 dark:border-cyan-300/15">
              {milestones.map((item, index) => (
                <li key={item.title} className="relative pb-10 last:pb-0">
                  <span className="absolute -left-[2.18rem] top-1 grid h-7 w-7 place-items-center rounded-full border-4 border-white bg-[#0873b8] text-[0.62rem] font-bold text-white shadow-[0_0_0_1px_#b9d9ea] dark:border-[#091528] dark:bg-cyan-400 dark:text-[#07101f] dark:shadow-[0_0_0_1px_rgba(103,232,249,.25)]">{index + 1}</span>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#0873b8] dark:text-cyan-300">{item.period}</p>
                  <h3 className="mt-2 text-xl font-bold tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </ScrollReveal>

      <ScrollReveal as="section" className="border-y border-[#dcebf4] bg-white/72 py-16 dark:border-white/[0.06] dark:bg-white/[0.025] md:py-24">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.08fr_.92fr]">
            <article className="relative overflow-hidden rounded-[1.7rem] border border-[#cce2ee] bg-[linear-gradient(145deg,#ffffff,#edf8fe)] p-7 shadow-[0_28px_65px_-48px_rgba(7,64,103,.65)] dark:border-white/10 dark:bg-[linear-gradient(145deg,#0d1b32,#081426)] sm:p-9">
              <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-cyan-300/20 blur-[75px]" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0873b8] dark:text-cyan-300"><Network size={16} /> Datacenter reference model</span>
                <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Mô hình hạ tầng 10Gbps là đích thiết kế, không phải số liệu đang bán</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">Sơ đồ dùng để giải thích khả năng mở rộng: reverse proxy nhận lưu lượng, Web API không giữ trạng thái phiên, SQL Server lưu nghiệp vụ và health endpoint tách liveness/readiness. Thông lượng thực tế chỉ được công bố sau khi có đo tải và hệ thống quan sát.</p>
                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {[{ icon: Cable, label: "Network", value: "10Gbps tham chiếu" }, { icon: Cpu, label: "Compute", value: "Scale theo workload" }, { icon: Server, label: "Health", value: "Live + Ready" }].map(({ icon: Icon, label, value }) => <div key={label} className="rounded-2xl border border-[#d8e9f2] bg-white/75 p-4 dark:border-white/[0.08] dark:bg-white/[0.045]"><Icon size={18} className="text-[#0873b8] dark:text-cyan-300" /><p className="mt-3 text-[0.65rem] font-bold uppercase tracking-[0.13em] text-slate-500">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>)}
                </div>
              </div>
            </article>

            <aside className="rounded-[1.7rem] border border-[#cce2ee] bg-white p-7 shadow-[0_28px_65px_-48px_rgba(7,64,103,.55)] dark:border-white/10 dark:bg-[#0d1b32] sm:p-9">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0873b8] dark:text-cyan-300">Compliance roadmap</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">Nói rõ trạng thái của từng huy hiệu</h2>
              <div className="mt-6 grid gap-3">
                {referenceBadges.map(({ icon: Icon, title, state, detail }) => <div key={title} className="flex gap-3 rounded-2xl border border-[#dbeaf2] bg-[#f8fcff] p-4 dark:border-white/[0.08] dark:bg-white/[0.035]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf7fd] text-[#0873b8] dark:bg-cyan-300/10 dark:text-cyan-300"><Icon size={18} /></span><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold">{title}</h3><span className="rounded-full border border-amber-300/70 bg-amber-50 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">{state}</span></div><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p></div></div>)}
              </div>
              <Link href="/services" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#0873b8] hover:underline dark:text-cyan-300">Xem cách các gói được mô hình hóa <ArrowRight size={16} /></Link>
            </aside>
          </div>
        </Container>
      </ScrollReveal>

      <ScrollReveal as="section" className="py-16 md:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#0873b8] dark:text-cyan-300">Cách nhóm phối hợp</p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Bốn phần việc, một hợp đồng dữ liệu</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">Trang chủ giúp khách chọn dịch vụ; trang Giới thiệu này giải thích nhóm là ai, xây hệ thống theo nguyên tắc nào và bằng chứng nào có thể mở ra kiểm tra khi bảo vệ.</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {workstreams.map(({ icon: Icon, label, title, detail }) => (
              <article key={title} className="group rounded-[1.45rem] border border-[#d3e5ef] bg-white/84 p-6 shadow-[0_20px_48px_-42px_rgba(7,64,103,.72)] transition duration-300 hover:-translate-y-1 hover:border-[#91c8e3] dark:border-white/[0.09] dark:bg-white/[0.035] dark:hover:border-cyan-300/22">
                <div className="flex items-center justify-between gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[#cee4f0] bg-[#eff9fe] text-[#0873b8] transition-transform group-hover:-translate-y-0.5 dark:border-cyan-300/15 dark:bg-cyan-300/[0.07] dark:text-cyan-300"><Icon size={19} /></span>
                  <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{detail}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 grid overflow-hidden rounded-[1.7rem] border border-[#c9e1ed] bg-[linear-gradient(135deg,#075f9d,#087ac1_52%,#06658e)] text-white shadow-[0_32px_70px_-42px_rgba(7,95,157,.85)] lg:grid-cols-[1fr_.85fr] dark:border-cyan-300/15 dark:bg-[linear-gradient(135deg,#0b1d34,#0c2941_52%,#102548)]">
            <div className="p-7 sm:p-9">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-cyan-100"><Workflow size={15} /> Phân quyền Affiliate</span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Admin và Editor là vai trò vận hành, không phải loại đối tác</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50/85">Cả hai được tiếp nhận và đổi trạng thái hồ sơ Affiliate theo đề bài. Admin giữ quyền cấu hình lõi, dashboard, export và audit; Editor xử lý nội dung, liên hệ, đơn và hồ sơ đối tác trong luồng đã định nghĩa.</p>
            </div>
            <div className="border-t border-white/12 bg-[#061126]/22 p-7 sm:p-9 lg:border-l lg:border-t-0">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-200">Bằng chứng có thể kiểm tra</p>
              <ul className="mt-4 grid gap-3 text-sm text-blue-50/90">
                {["Health live / ready và migration SQL", "Unit test cho invariant nghiệp vụ", "Audit log, concurrency và refresh rotation", "API contract dùng chung cho Next.js và Admin"].map((item) => <li key={item} className="flex items-start gap-2.5"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-300" />{item}</li>)}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-[1.35rem] border border-[#d6e7f0] bg-white/70 p-6 sm:flex-row sm:items-center dark:border-white/[0.08] dark:bg-white/[0.025]">
            <div><h2 className="text-lg font-bold">Muốn kiểm tra sản phẩm thay vì chỉ đọc giới thiệu?</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Đi từ danh mục đến báo giá và mã tra cứu bằng chính API đang chạy.</p></div>
            <Link href="/advisor" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-[#075f9d] px-5 py-2.5 text-sm font-bold text-white shadow-[0_14px_30px_-18px_rgba(7,95,157,.85)] transition hover:-translate-y-0.5 hover:bg-[#087ac1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#087ac1] dark:bg-cyan-300 dark:text-[#07101f] dark:hover:bg-cyan-200">Thử luồng tư vấn <ArrowRight size={16} /></Link>
          </div>
        </Container>
      </ScrollReveal>
    </main>
  );
}
