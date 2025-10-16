"use client"

const TournamentRules = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <h1 className="text-3xl font-bold text-center">
            2025 TOURNAMENT RULES
          </h1>
          <p className="text-blue-100 text-center mt-2">
            Official Tournament Guidelines and Regulations
          </p>
        </div>

        {/* PDF Content */}
        <div className="p-6 sm:p-8">
          {/* Page 1 */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-blue-200">
              TOURNAMENT RULES
            </h2>

            <div className="space-y-4 text-gray-700">
              <ul className="list-disc pl-5 space-y-3">
                <li>Teams have been divided into four groups.</li>
                <li>
                  Standard World Aquatics rules apply apart from:
                  <ul className="list-circle pl-6 mt-2 space-y-2">
                    <li>
                      The SWPSA bye-law restriction for Boys U14 and below, which prohibits a direct shot, but boys may play and go.
                    </li>
                    <li>
                      Flying subs will not be allowed. Substitutions must be made in the reentry area.
                    </li>
                  </ul>
                </li>
                <li>
                  Group stage games will consist of <span className="font-mono">2 × 8</span> min chukkas running. No warm-ups
                </li>
                <li>
                  3 points will be awarded for a win, 1 point for a draw, 0 points for a loss.
                  <ul className="list-circle pl-6 mt-2">
                    <li>There will be no penalty shootouts in the group stage.</li>
                  </ul>
                </li>
                <li>
                  The four top-scoring teams in each pool will meet in the cup round of 16, those not competing in the knock out will proceed to a round robin festival. Knock out and festival games will consist of <span className="font-mono">2 × 10</span> min chukkas.
                </li>
                <li>Teams to please be in the pool immediately after the previous game has ended.</li>
              </ul>

              <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  Discipline and Conduct Guidelines
                </h3>
                <div className="space-y-3">
                  <p>
                    <strong>Aggressive Play:</strong> any action deemed excessively aggressive will be addressed through a formal warning. Repeated incidents of aggressive play may result in further disciplinary action, but will not incur an immediate suspension.
                  </p>
                  <p>
                    <strong>Violent Action:</strong> Any player involved in violent actions, including but not limited to intentional physical harm or extreme unsportsmanlike behavior, will be subject to an automatic one-game suspension. This measure aims to maintain a safe and respectful environment for all participants.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-bold text-lg text-gray-800 mb-3">
                  Group Stage Tiebreaker Rules
                </h3>
                <p className="mb-3">
                  In the event of a tie (on points) for teams to qualify for the quarters:
                </p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>The team that won the mutual encounter will be placed ahead.</li>
                  <li>If the mutual encounter was drawn the result against the highest ranked team, uninvolved in the deadlock, will determine the order.</li>
                  <li>If the teams are still in a deadlock, goals for will decide the order</li>
                  <li>If the teams remain tied, with the same number of goals for, the total goal difference will be the decider.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Page 2 */}
          <div className="mt-12 pt-8 border-t-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Tiebreaker Rules – Multi-Team Deadlock
            </h2>
            <p className="text-gray-700 mb-6">
              In the event that three or more teams finish on equal points, the following procedure will be applied to determine the rankings:
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg text-gray-800 mb-3">
                  1. Sub-Pool Ranking (Mini-League)
                </h3>
                <p className="text-gray-700 mb-2">
                  A sub-pool (or mini-league) will be created including only the teams involved in the tie. Within this group:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Teams will be ranked based on points earned against each other (3 points for a win, 1 point for a draw).</li>
                  <li>Only the results of matches between the tied teams will be considered.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  2. New Two-Team Tie
                </h3>
                <p className="text-gray-700">
                  If the sub-pool results produce a new tie between two teams, the outcome of their mutual encounter will be used to rank them.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  3. Goals For
                </h3>
                <p className="text-gray-700">
                  If more than two teams remain tied after the sub-pool ranking, the team with the highest number of goals scored ("Goals For") in the matches between the tied teams will be ranked higher.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  4. Goal Difference
                </h3>
                <p className="text-gray-700">
                  If the teams are still tied, the team with the highest total goal difference (Goals For minus Goals Against) in the matches between the tied teams will be ranked higher.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  5. Disciplinary Record
                </h3>
                <p className="text-gray-700">
                  If the tie persists, the team with the best disciplinary record throughout the group stage (i.e. the fewest exclusions and cards) will be ranked higher.
                </p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-400">
              <h3 className="font-bold text-lg text-gray-800 mb-3">
                Knockout Stage Rules
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>In the event of a tie in the knockout, a penalty shootout, involving three designated penalty takers will take place.</li>
                <li>In the event of a tie in the final, a penalty shootout, involving five designated penalty takers will take place.</li>
                <li>Time outs will only be allowed in the final - two timeouts per team will be allowed.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
            <span>Document ID: TR-2025-001</span>
            <span>Last updated: January 2025</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentRules;