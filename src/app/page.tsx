import { HomeHero } from "@/components/home/home-hero";
import { CoreModulesJourney } from "@/components/shared/core-modules-journey";
import { FaqMiniAccordion } from "@/components/shared/faq-mini-accordion";
import { StoriesStack } from "@/components/shared/stories-stack";
import { SupportWorkspacePanels } from "@/components/shared/support-workspace-panels";

export default function HomePage() {
  return (
    <div>
      <HomeHero />

      <CoreModulesJourney />
      <StoriesStack />
      <SupportWorkspacePanels />
      <FaqMiniAccordion />
    </div>
  );
}
