import { TrackOrder } from "./track-order";
export default async function TrackOrderPage({ params }: { params: Promise<{ trackingCode: string }> }) { const { trackingCode } = await params; return <TrackOrder trackingCode={trackingCode} />; }
