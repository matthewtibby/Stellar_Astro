import { motion } from 'framer-motion';

interface WelcomeDashboardProps {
  userName?: string;
  onCreateProject: () => void;
  onShowMeAround: () => void;
}

export default function WelcomeDashboard({ userName = "Astronomer", onCreateProject, onShowMeAround }: WelcomeDashboardProps) {
  return (
    <div className="relative min-h-screen bg-cover bg-center text-white" style={{ backgroundImage: "url('/images/milkyway.jpg')" }}>
      {/* Overlay for darkness */}
      <div className="absolute inset-0 bg-black bg-opacity-60 z-0" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 space-y-10">
        {/* Greeting and Actions */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Welcome to Stellar Astro, {userName}!</h1>
          <p className="text-lg">Start by uploading your light frames or creating a template.</p>

          <div className="flex flex-col items-center space-y-3">
            <button
              className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition text-lg shadow-lg"
              onClick={onCreateProject}
            >
              + Create Your First Project
            </button>
            <button
              className="text-white underline hover:text-gray-300 text-base"
              onClick={onShowMeAround}
            >
              Show Me Around
            </button>
          </div>
        </div>

        {/* Orion Onboarding Card */}
        <div className="mt-10 w-full max-w-sm bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Orion Onboarding</h2>
          <ul className="space-y-3 text-white text-sm">
            <li>🧭 Getting Started</li>
            <li>📁 Create Project</li>
            <li>🛠️ Explore Tools</li>
            <li>🌌 Community Wall</li>
          </ul>
        </div>

        {/* Floating Orion constellation (optional) */}
        <motion.div
          className="absolute top-10 right-10 opacity-80"
          initial={{ y: -10 }}
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          <img src="/images/orion-icon.png" alt="Orion Constellation" className="w-24 h-24" />
        </motion.div>
      </div>
    </div>
  );
} 