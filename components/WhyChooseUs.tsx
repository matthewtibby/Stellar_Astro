import { LucideCloud, LucideDollarSign, LucideUsers, LucideLayoutGrid } from 'lucide-react'

const features = [
  {
    icon: <LucideCloud className="text-blue-400 w-8 h-8 mb-4" />,
    title: 'Web-Based',
    description:
      'Access your projects from anywhere via browser. No installation required.',
  },
  {
    icon: <LucideDollarSign className="text-blue-400 w-8 h-8 mb-4" />,
    title: 'Subscription Based',
    description:
      'Flexible free and paid plans. Professional tools without the cost barrier.',
  },
  {
    icon: <LucideLayoutGrid className="text-blue-400 w-8 h-8 mb-4" />,
    title: 'Collaborate Anywhere',
    description:
      'Real-time or async teamwork on astro projects, instantly synced.',
  },
  {
    icon: <LucideUsers className="text-blue-400 w-8 h-8 mb-4" />,
    title: 'Community Led',
    description:
      'A vibrant community hub with forums, feedback, and awards.',
  },
]

export default function WhyChooseUs() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
          Why Choose Stellar Astro
        </h2>
        <p className="text-slate-300 mb-12 max-w-2xl mx-auto">
          Experience the future of astrophotography processing with our cutting-edge platform
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group bg-slate-800/70 backdrop-blur-md p-6 rounded-2xl text-left 
                       hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-300
                       shadow-md border border-slate-700/50 hover:border-blue-500/50
                       hover:transform hover:scale-105"
            >
              <div className="group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 font-display">
                {feature.title}
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 