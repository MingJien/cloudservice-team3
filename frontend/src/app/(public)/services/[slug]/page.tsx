import { ServiceDetail } from "./service-detail";
export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <ServiceDetail slug={slug} />; }
