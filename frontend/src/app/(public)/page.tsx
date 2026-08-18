import { AdvisorSection } from "@/components/landing/advisor-section";
import { DatacenterSlaSection } from "@/components/landing/datacenter-sla-section";
import { FeaturedPlansSection } from "@/components/landing/featured-plans-section";
import { HeroSection } from "@/components/landing/hero-section";
import { NewsSection } from "@/components/landing/news-section";
import { PricingToolsSection } from "@/components/landing/pricing-tools-section";
import { ServiceCategoriesSection } from "@/components/landing/service-categories-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { TrustStripSection } from "@/components/landing/trust-strip-section";

export default function HomePage() {
  return <main><HeroSection /><TrustStripSection /><ServiceCategoriesSection /><FeaturedPlansSection /><PricingToolsSection /><AdvisorSection /><DatacenterSlaSection /><TestimonialsSection /><NewsSection /></main>;
}
