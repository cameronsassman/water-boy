// src/app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            🏊‍♂️ U14 Water Polo Tournament 2025
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            28 Schools • 4 Pools • Championship Glory
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/pools"
              className="bg-white text-blue-800 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              View Pool Standings
            </Link>
            <Link 
              href="/brackets"
              className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors border border-blue-500"
            >
              Tournament Bracket
            </Link>
          </div>
        </div>
      </section>

      {/* Video Messages Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Tournament Messages
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Headmaster Message */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Welcome from the Headmaster
                </h3>
                <p className="text-gray-600">
                  A message about sportsmanship and excellence
                </p>
              </div>
              
              <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center mb-4">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">🎥</div>
                  <p>Headmaster Welcome Video</p>
                  <p className="text-sm">(Video will be embedded here)</p>
                </div>
              </div>
              
              <p className="text-gray-700 text-center text-sm">
                Welcome to our annual U14 Water Polo Tournament. We wish all teams the very best of luck!
              </p>
            </div>

            {/* Team Captain Message */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  From the Team Captains
                </h3>
                <p className="text-gray-600">
                  Inspiration from student leaders
                </p>
              </div>
              
              <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center mb-4">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">🎥</div>
                  <p>Captain Message Video</p>
                  <p className="text-sm">(Video will be embedded here)</p>
                </div>
              </div>
              
              <p className="text-gray-700 text-center text-sm">
                Hear from team captains about fair play and giving your best effort in every match.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Cards */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Tournament Hub
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Pool Standings Card */}
            <Link href="/pools" className="group">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow group-hover:scale-105 transition-transform">
                <div className="text-center">
                  <div className="text-4xl mb-4">🏊‍♂️</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Pool Standings</h3>
                  <p className="text-gray-600 text-sm">
                    Check your team's position in Pool A, B, C, or D
                  </p>
                </div>
              </div>
            </Link>

            {/* Teams Card */}
            <Link href="/teams" className="group">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow group-hover:scale-105 transition-transform">
                <div className="text-center">
                  <div className="text-4xl mb-4">🏫</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">All Teams</h3>
                  <p className="text-gray-600 text-sm">
                    Browse all 28 participating schools and their players
                  </p>
                </div>
              </div>
            </Link>

            {/* Bracket Card */}
            <Link href="/brackets" className="group">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow group-hover:scale-105 transition-transform">
                <div className="text-center">
                  <div className="text-4xl mb-4">🥇</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Tournament Bracket</h3>
                  <p className="text-gray-600 text-sm">
                    Follow the knockout stages and championship path
                  </p>
                </div>
              </div>
            </Link>

            {/* Scores Card */}
            <Link href="/scores" className="group">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow group-hover:scale-105 transition-transform">
                <div className="text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Match Results</h3>
                  <p className="text-gray-600 text-sm">
                    View completed match scores and upcoming fixtures
                  </p>
                </div>
              </div>
            </Link>

            {/* Rules Card */}
            <Link href="/rules" className="group">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow group-hover:scale-105 transition-transform">
                <div className="text-center">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Tournament Rules</h3>
                  <p className="text-gray-600 text-sm">
                    Format, regulations, and competition structure
                  </p>
                </div>
              </div>
            </Link>

            {/* Sponsors Card */}
            <Link href="/sponsors" className="group">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow group-hover:scale-105 transition-transform">
                <div className="text-center">
                  <div className="text-4xl mb-4">🤝</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Our Sponsors</h3>
                  <p className="text-gray-600 text-sm">
                    Thank you to our tournament supporters
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Tournament Stats Preview */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
              Tournament at a Glance
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">28</div>
                <div className="text-gray-600">Schools</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">4</div>
                <div className="text-gray-600">Pools</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">84</div>
                <div className="text-gray-600">Pool Matches</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">3</div>
                <div className="text-gray-600">Knockout Stages</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}