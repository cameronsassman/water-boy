import Link from 'next/link';
import background from "../../public/images/Background.jpg"
import logo from "../../public/images/Logo-pack/junior-wp-logo-tranparent.png"
import investments from "../../public/images/Sponsors Logos/MnG-Investments-Logo.png"
import geddes from "../../public/images/Sponsors Logos/Geddes.jpeg"
import rsa_web from "../../public/images/Sponsors Logos/RSA-WEB.png"
import stikka from "../../public/images/Sponsors Logos/STIKKA.png"
import fnb from "../../public/images/Sponsors Logos/FNB.png"
import zapmed from "../../public/images/Sponsors Logos/ZAPMED.png"
import Image from 'next/image';

// Import fixture images
import day1Fixture from "../../public/images/fixtures/Wednesday.png";
import day2Fixture from "../../public/images/fixtures/Thursday.png";
import day3Fixture from "../../public/images/fixtures/Friday.png";
import poolsFixture from "../../public/images/fixtures/Saturday.png";

const sponsors = [
  { image: investments, alt: "MnG Investments" },
  { image: geddes, alt: "Geddes" },
  { image: rsa_web, alt: "RSA Web" },
  { image: stikka, alt: "STIKKA" },
  { image: fnb, alt: "FNB" },
  { image: zapmed, alt: "ZAPMED" },
];

const videoMessages = [
  {
    title: "Welcome from the Headmaster",
    description: "A message about sportsmanship and excellence",
    placeholder: "Headmaster Welcome Video",
    content: "Welcome to our annual U14 Water Polo Tournament. We wish all teams the very best of luck!",
    videoSrc: "/videos/GS-Welcoming.mp4"
  },
  {
    title: "From the Team Captains",
    description: "Inspiration from student leaders",
    placeholder: "Captain Message Video",
    content: "Hear from team captains about fair play and giving your best effort in every match.",
    videoSrc: "/videos/Captains.mp4"
  }
];

// Separate fixture images - using imported images for preview and string paths for download
const fixtureFiles = [
  { 
    name: "Day 1 Schedule", 
    path: "/images/fixtures/Wednesday.png",
    image: day1Fixture,
    description: "Wednesday matches and timings"
  },
  { 
    name: "Day 2 Schedule", 
    path: "/images/fixtures/Thursday.png",
    image: day2Fixture,
    description: "Thursday matches and timings"
  },
  { 
    name: "Day 3 Schedule", 
    path: "/images/fixtures/Friday.png",
    image: day3Fixture,
    description: "Friday matches and finals"
  },
  { 
    name: "Day 4 Schedule", 
    path: "/images/fixtures/Saturday.png",
    image: poolsFixture,
    description: "Saturday matches and finals"
  }
];

export default function HomePage() {
  return (
    <div>
      {/* Hero Section with Background */}
      <section className="relative text-white pt-20 pb-40 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image 
            src={background}
            fill
            alt="Water polo background"
            className="object-cover opacity-70 object-bottom"
            priority
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className='flex justify-center'>
            <Image
              src={logo}
              width={400}
              height={400}
              alt="Water polo logo"
              priority
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link 
              href="/pools"
              className="bg-white text-blue-800 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              View Pool Standings
            </Link>
            
            {/* View Fixtures Button - Links to fixtures section */}
            <a 
              href="#fixtures"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl border border-blue-500 flex items-center justify-center gap-2"
            >
              View Fixtures
            </a>
          </div>
        </div>
      </section>

      {/* Tournament Messages Section */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            {videoMessages.map((message, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-2 border-blue-100 hover:border-blue-300 transition-all duration-300">
                <div className="text-center mb-4 md:mb-6">
                  <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
                    {message.title}
                  </h3>
                </div>
                
                {/* Video Player */}
                <div className="rounded-lg aspect-video mb-4 overflow-hidden bg-black">
                  <video
                    controls
                    className="w-full h-full object-cover"
                    preload="metadata"
                    playsInline
                  >
                    <source src={message.videoSrc} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fixtures Section */}
      <section id="fixtures" className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Tournament Fixtures
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Download individual fixture schedules for each day
            </p>
          </div>
          
          <div className="bg-blue-50 rounded-xl shadow-lg p-6 md:p-8 border-2 border-blue-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fixtureFiles.map((file, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-md border border-blue-200 hover:border-blue-400 transition-all duration-300">
                  <div className="text-center">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                      {file.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {file.description}
                    </p>
                    
                    {/* Preview Image - Using imported image object */}
                    <div className="mb-4 rounded-lg overflow-hidden border-2 border-gray-200">
                      <Image
                        src={file.image}
                        width={300}
                        height={200}
                        alt={file.name}
                        className="w-full h-auto object-contain"
                        placeholder="blur"
                      />
                    </div>
                    
                    {/* Download Button - Using string path */}
                    <a 
                      href={file.path}
                      download={`${file.name.replace(/\s+/g, '-')}.png`}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Download All Section */}
            <div className="mt-8 pt-6 border-t border-blue-200">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Download All Fixtures
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {fixtureFiles.map((file, index) => (
                    <a 
                      key={index}
                      href={file.path}
                      download={`${file.name.replace(/\s+/g, '-')}.png`}
                      className="inline-flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 transition-all duration-300"
                    >
                      {file.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-blue-50 to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Our Sponsors
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Thank you to our generous sponsors for making this tournament possible
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border-2 border-blue-100">
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12 items-center justify-items-center mt-8">
              {sponsors.map((sponsor, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-center p-4 md:p-6 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-300"
                >
                  <Image
                    src={sponsor.image}
                    width={240}
                    height={100}
                    alt={sponsor.alt}
                    className="w-full max-w-[200px] md:max-w-[240px] lg:max-w-[260px] h-auto object-contain"
                    sizes="(max-width: 768px) 200px, (max-width: 1024px) 240px, 260px"
                  />
                </div>
              ))}
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden grid grid-cols-2 gap-6 items-center justify-items-center">
              {sponsors.map((sponsor, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <Image
                    src={sponsor.image}
                    width={160}
                    height={70}
                    alt={sponsor.alt}
                    className="w-full max-w-[140px] h-auto object-contain"
                    sizes="140px"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}