export default function CommunityInfo() {
  return (
    <div className="flex-1 bg-[#111111] rounded-2xl border border-[#2a2a2a] overflow-hidden flex flex-col">
      {/* Community Description */}
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-4">About Project 50</h2>
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <p className="text-gray-300 leading-relaxed">
            Project 50 is a community-driven initiative focused on helping individuals build and maintain better habits over 50 days. Our goal is to create a supportive environment where members can share their progress, challenges, and successes while working towards personal growth.
          </p>
          <div className="mt-6">
            <h3 className="text-white font-medium mb-2">Community Goals</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Build sustainable daily habits</li>
              <li>Support each other's growth journey</li>
              <li>Share knowledge and experiences</li>
              <li>Celebrate milestones together</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Creator Section */}
      <div className="p-6 border-t border-[#2a2a2a]">
        <h2 className="text-2xl font-bold text-white mb-4">Community Creator</h2>
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#2a2a2a]">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="Creator"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-white font-medium">Alex Johnson</h3>
              <p className="text-gray-400">Founder & Lead Mentor</p>
              <p className="text-gray-300 mt-2">
                "I created Project 50 to help people transform their lives through consistent habit-building. With over 5 years of experience in personal development, I'm excited to guide you on this journey."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Community Stats */}
      <div className="p-6 border-t border-[#2a2a2a]">
        <h2 className="text-2xl font-bold text-white mb-4">Community Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
            <p className="text-gray-400 text-sm">Total Members</p>
            <p className="text-white text-2xl font-bold">42</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
            <p className="text-gray-400 text-sm">Active Members</p>
            <p className="text-white text-2xl font-bold">38</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
            <p className="text-gray-400 text-sm">Total Points</p>
            <p className="text-white text-2xl font-bold">1,234</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
            <p className="text-gray-400 text-sm">Days Active</p>
            <p className="text-white text-2xl font-bold">15</p>
          </div>
        </div>
      </div>
    </div>
  );
} 