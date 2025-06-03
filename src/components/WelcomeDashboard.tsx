import { useState } from 'react';
<<<<<<< HEAD
import { motion } from 'framer-motion';
import { Plus, ChevronRight } from 'lucide-react';
import OnboardingTour from './OnboardingTour';
import { projectTemplates, getTemplatesByCategory } from '@/src/utils/projectTemplates';
=======
import { ChevronRight } from 'lucide-react';
import OnboardingTour from './OnboardingTour';
import { getTemplatesByCategory } from '@/src/utils/projectTemplates';
>>>>>>> calibration

interface WelcomeDashboardProps {
  userName?: string;
  onCreateProject: () => void;
}

const SHOW_DEMO_TOUR = false;

export default function WelcomeDashboard({ userName = "Astronomer", onCreateProject }: WelcomeDashboardProps) {
<<<<<<< HEAD
  const [showTour, setShowTour] = useState(true);
=======
  const [showTour] = useState(true);
>>>>>>> calibration
  const templates = getTemplatesByCategory('deep-sky');

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
          </div>
        </div>

        {/* Project Templates */}
        <div className="w-full max-w-4xl">
          <h2 className="text-xl font-semibold mb-4">Project Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
<<<<<<< HEAD
              <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 shadow-lg">
=======
              <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 shadow-lg" key={template.id}>
>>>>>>> calibration
                <h3 className="text-lg font-semibold mb-2">{template.name}</h3>
                <p className="text-gray-300 text-sm mb-4">{template.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-400 w-24">Telescope:</span>
                    <span>{template.recommendedEquipment.telescope.model}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-400 w-24">Camera:</span>
                    <span>{template.recommendedEquipment.camera.model}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-400 w-24">Exposure:</span>
                    <span>{template.recommendedSettings.exposure}s</span>
                  </div>
                </div>
                <button
                  onClick={() => onCreateProject()}
                  className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <span>Use Template</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Orion constellation (optional) */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent" />
      </div>

      {SHOW_DEMO_TOUR && showTour && (
        <OnboardingTour />
      )}
    </div>
  );
} 