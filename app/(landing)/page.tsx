import HeroSection from "./_components/Home/HeroSection";
import AboutTeaserSection from "./_components/Home/AboutTeaserSection";
import PotentialSection from "./_components/Home/PotentialSection";
import TrainingSpaceSection from "./_components/Home/TrainingSpaceSection";
import CoachesSection from "./_components/Home/CoachesSection";
import AwardsTestimonialsSection from "./_components/Home/AwardsTestimonialsSection";
import FaqBlogSection from "./_components/Home/FaqBlogSection";
import CtaSection from "./_components/Home/CtaSection";
import FooterSection from "./_components/Home/FooterSection";
import { getAcademyProfile } from "@/lib/services/academy";
import { listCoaches } from "@/lib/services/coaches";

export default async function Home() {
  const academyProfile = await getAcademyProfile();
  const phone = academyProfile?.phone || undefined;
  const phone2 = academyProfile?.phone2 || undefined;

  const dbCoaches = await listCoaches({ status: "WORKING", role: "COACH" });
  const serializedCoaches = dbCoaches.map((c) => ({
    id: c.id,
    name: c.name,
    specialization: c.specialization,
    avatarUrl: c.avatarUrl,
    bio: c.bio,
    experience: c.experience,
    certifications: c.certifications,
  }));

  return (
    <>
      <HeroSection />
      <AboutTeaserSection phone={phone} />
      <PotentialSection />
      <TrainingSpaceSection />
      <CoachesSection initialCoaches={serializedCoaches} />
      <AwardsTestimonialsSection />
      <FaqBlogSection phone={phone} phone2={phone2} />
      <CtaSection phone={phone} />
      <FooterSection phone={phone} phone2={phone2} />
    </>
  );
}
