import { Container } from "@/components/layout/container";
import { RoutePlaceholder } from "./route-placeholder";

export function PublicRoutePlaceholder(props: { title: string; owner: string; description: string }) {
  return <main className="py-14 md:py-20"><Container><RoutePlaceholder {...props} /></Container></main>;
}
