import HeroSection from "./_components/Home/HeroSection";
import AboutTeaserSection from "./_components/Home/AboutTeaserSection";
import PotentialSection from "./_components/Home/PotentialSection";
import TrainingSpaceSection from "./_components/Home/TrainingSpaceSection";
import CoachesSection from "./_components/Home/CoachesSection";
import AwardsTestimonialsSection from "./_components/Home/AwardsTestimonialsSection";
import FaqBlogSection from "./_components/Home/FaqBlogSection";
import CtaSection from "./_components/Home/CtaSection";
import FooterSection from "./_components/Home/FooterSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <AboutTeaserSection />
      <PotentialSection />
      <TrainingSpaceSection />
      <CoachesSection />
      <AwardsTestimonialsSection />
      <FaqBlogSection />
      <CtaSection />
      <FooterSection />
    </>
  );
}
