import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/container";

export function LandingSectionPlaceholder({ id, eyebrow, title, description, owner, muted = false }: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  owner: string;
  muted?: boolean;
}) {
  return (
    <section id={id} className={muted ? "bg-ice-100 py-14 md:py-22" : "py-14 md:py-22"}>
      <Container>
        <Card className="shadow-none">
          <Badge variant="info">{eyebrow}</Badge>
          <h2 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-river-700">Chủ module: {owner}</p>
        </Card>
      </Container>
    </section>
  );
}
