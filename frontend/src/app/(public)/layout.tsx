import { Suspense, type ReactNode } from "react";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { CategoryNav } from "@/components/layout/category-nav";
import { FloatingActionButtons } from "@/components/widgets/floating-action-buttons";
import { AffiliateTracker } from "@/components/public/affiliate-tracker";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      <Suspense fallback={null}>
        <CategoryNav />
        <AffiliateTracker />
      </Suspense>
      {/* Spacer to prevent fixed header + category-nav from covering content */}
      <div className="h-[7.25rem]" aria-hidden="true" />
      {children}
      <FloatingActionButtons />
      <PublicFooter />
    </>
  );
}
