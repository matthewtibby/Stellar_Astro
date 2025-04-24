import { Monitor, UserCheck, Users, MessageSquare } from "lucide-react";

const features = [
  {
    name: "Web-Based",
    description: "Access from any device, no downloads required",
    icon: Monitor
  },
  {
    name: "Beginner-Friendly",
    description: "Intuitive tools for processing deep-sky images",
    icon: UserCheck
  },
  {
    name: "Collaborate Anywhere",
    description: "Work on projects together in real-time",
    icon: Users
  },
  {
    name: "Community-Led",
    description: "Share your results and get feedback",
    icon: MessageSquare
  }
];

export default function Features() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Why Choose Us</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience the future of astrophotography processing with our cutting-edge platform
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.name} className="relative group bg-slate-800/30 backdrop-blur-md p-6 rounded-lg shadow-lg hover:bg-slate-700/30 transition-colors">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">{feature.name}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 