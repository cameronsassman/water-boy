import Image from "next/image";
import { getTournament } from "@/lib/db";
import { fetchHomeData } from "@/lib/home-data";
import HomeDataProvider from "@/components/HomeDataProvider";
import LivePanel from "@/components/LivePanel";
import HomeMain from "@/components/HomeMain";
import Bubble from "@/components/Bubble";
import VideoCard from "@/components/VideoCard";
import SvgSlider from "@/components/SvgSlider";
import { SHEET_URL } from "@/lib/links";

// Static page regenerated at most every 10s and served from Vercel's CDN.
// After first paint, HomeDataProvider polls /api/home for live updates.
export const revalidate = 10;

const VIDEOS = [
  {
    role: "headmaster",
    title: "Welcome to Tournament 2026",
    video_url: "/videos/headmaster.mp4",
    poster: "/videos/headmaster.jpg",
  },
  {
    role: "captain",
    title: "A message from the captains",
    video_url: "/videos/captain.mp4",
    poster: "/videos/captain.jpg",
  },
];

const SLIDES = [
  { src: "/slides/4.svg", alt: "Tournament slide 1" },
  { src: "/slides/5.svg", alt: "Tournament slide 2" },
];

const SPONSORS: { name: string; tier: string; logo_url?: string; is_charity?: boolean }[] = [
  { name: "RSAWEB", tier: "headline", logo_url: "/assets/rsaweb.png" },
  { name: "Hudsons", tier: "tier_one", logo_url: "/assets/hudsons.png" },
  { name: "First National Bank", tier: "tier_one", logo_url: "/assets/fnb.png" },
  { name: "Sports Science Physiotherapy Centre", tier: "tier_two", logo_url: "/assets/sspc.png" },
  { name: "Geddes Capital", tier: "smaller", logo_url: "/assets/geddes.jpeg" },
  { name: "Shout Music Company", tier: "smaller", logo_url: "/assets/shout.png" },
  { name: "KY-ND", tier: "smaller", logo_url: "/assets/ky-nd.png", is_charity: true },
];

export default async function HomePage() {
  const [tournament, initial] = await Promise.all([getTournament(), fetchHomeData()]);
  const name = tournament?.name ?? "Water Polo Tournament";
  const dates = tournament?.dates ?? tournament?.date_range ?? "";
  const venue = tournament?.venue ?? "";

  const headmaster = VIDEOS.find((v) => v.role === "headmaster");
  const captain = VIDEOS.find((v) => v.role === "captain");
  const bannerSponsors = SPONSORS.filter((s) => s.tier === "headline" || s.is_charity);
  const marqueeSponsors = SPONSORS;

  return (
    <div className="min-h-screen bg-[#EAF6FE]">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <HomeDataProvider initial={initial}>
          <section className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 items-stretch">
            <div className="relative bg-white rounded-3xl border border-[#CFE6F8] shadow-sm px-8 py-9 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center justify-between flex-wrap">
                  <Image
                    src="/assets/logo/powered-by-logo.jpg"
                    alt={name}
                    width={857}
                    height={720}
                    priority
                    className="w-auto h-auto max-h-[130px] sm:max-h-[160px]"
                  />

                  {bannerSponsors.length > 0 && (
                    <div className="flex flex-col items-start gap-4">
                      {bannerSponsors.map((s) =>
                        s.logo_url ? (
                          <img
                            key={s.name}
                            src={s.logo_url}
                            alt={s.name}
                            className="h-20 sm:h-24 object-contain"
                          />
                        ) : (
                          <span key={s.name} className="font-bold text-2xl text-[#07091F]">
                            {s.name}
                          </span>
                        ),
                      )}
                    </div>
                  )}
                </div>

                {(venue || dates) && (
                  <p className="mt-4 text-[#5C7B9C] text-sm font-medium">
                    {venue}
                    {venue && dates ? " · " : ""}
                    {dates}
                  </p>
                )}

                <a
                  href={SHEET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1B6FC8] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#07091F] transition-colors"
                >
                  Knockout Tree
                </a>
              </div>
            </div>

            <LivePanel />
          </section>

          <HomeMain slider={<SvgSlider slides={SLIDES} />} />
        </HomeDataProvider>

        {(headmaster || captain) && (
          <section id="welcome">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[headmaster, captain].filter(Boolean).map((v: any) => {
                const cardClassName =
                  "rounded-2xl border border-[#CFE6F8] bg-white hover:border-[#1B6FC8] transition-colors overflow-hidden";

                const placeholder = (
                  <div className="bg-[#07091F] aspect-video flex items-center justify-center relative overflow-hidden">
                    {v.poster ? (
                      <>
                        <img
                          src={v.poster}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-[#07091F]/30" />
                      </>
                    ) : (
                      <>
                        <Bubble className="w-24 h-24 -top-8 -left-8 bg-[#1B6FC8]/10 border-0" />
                        <Bubble className="w-16 h-16 bottom-4 right-8 bg-[#F5C518]/10 border-0" />
                      </>
                    )}
                    <div className="relative w-14 h-14 rounded-full bg-[#F5C518] flex items-center justify-center">
                      <div className="w-0 h-0 border-y-[11px] border-y-transparent border-l-[20px] border-l-[#07091F] ml-1" />
                    </div>
                  </div>
                );

                const caption = (
                  <div className="p-4">
                    <div className="text-[#1B6FC8] text-[10px] font-bold uppercase tracking-widest mb-1">
                      {v.role === "headmaster" ? "Headmaster" : "Team Captains"}
                    </div>
                    <div className="font-black uppercase text-sm text-gray-900 mb-1">{v.title}</div>
                  </div>
                );

                return v.video_url ? (
                  <VideoCard
                    key={v.role}
                    src={v.video_url}
                    poster={v.poster}
                    className={cardClassName}
                    placeholder={placeholder}
                  >
                    {caption}
                  </VideoCard>
                ) : (
                  <div key={v.role} className={cardClassName}>
                    {placeholder}
                    {caption}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {marqueeSponsors.length > 0 && (
          <section className="border-t border-[#CFE6F8] pt-8 -mx-6 px-6">
            <div className="relative w-full overflow-hidden">
              <div className="flex items-center gap-12 w-max animate-marquee">
                {[...marqueeSponsors, ...marqueeSponsors].map((s, i) =>
                  s.logo_url ? (
                    <img
                      key={i}
                      src={s.logo_url}
                      alt={s.name}
                      className="h-20 object-contain shrink-0 opacity-80"
                    />
                  ) : (
                    <span key={i} className="text-xs font-semibold uppercase text-gray-400 shrink-0">
                      {s.name}
                    </span>
                  ),
                )}
              </div>
            </div>
          </section>
        )}

        <footer className="border-t border-[#CFE6F8] pt-5 flex justify-between items-center text-xs text-[#9FB6CC]">
          <span>
            © {new Date().getFullYear()} {name}
          </span>
        </footer>
      </div>
    </div>
  );
}