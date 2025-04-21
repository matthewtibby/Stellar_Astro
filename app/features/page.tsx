"use client";

import { CloudArrowUpIcon, LockClosedIcon, ServerIcon } from '@heroicons/react/20/solid';

const features = [
  {
    name: 'Advanced Image Processing',
    description:
      'Our AI-powered algorithms enhance your astronomical images with precision calibration, noise reduction, and color enhancement to bring out the finest details in your captures.',
    icon: CloudArrowUpIcon,
  },
  {
    name: 'Secure Cloud Storage',
    description: 'Your images are stored securely in our cloud with automatic backups and version history, ensuring your valuable astronomical data is always safe and accessible.',
    icon: LockClosedIcon,
  },
  {
    name: 'Collaborative Projects',
    description: 'Work with fellow astronomers on joint projects, share your findings, and contribute to the growing community of astrophotographers worldwide.',
    icon: ServerIcon,
  },
];

export default function FeaturesPage() {
  return (
    <div className="overflow-hidden bg-black py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          <div className="lg:pt-4 lg:pr-8">
            <div className="lg:max-w-lg">
              <h2 className="text-base font-semibold leading-7 text-primary">Stellar Features</h2>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Powerful Tools for Astrophotography
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Stellar Astro provides professional-grade tools for processing and enhancing your astronomical images. 
                Our platform combines cutting-edge AI technology with intuitive controls to help you capture the beauty of the cosmos.
              </p>
              <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-gray-300 lg:max-w-none">
                {features.map((feature) => (
                  <div key={feature.name} className="relative pl-9">
                    <dt className="inline font-semibold text-white">
                      <feature.icon className="absolute left-1 top-1 h-5 w-5 text-primary" aria-hidden="true" />
                      {feature.name}
                    </dt>{' '}
                    <dd className="inline">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="relative">
            <div className="w-[48rem] max-w-none rounded-xl shadow-xl ring-1 ring-gray-800 sm:w-[57rem] md:-ml-4 lg:-ml-0 bg-gray-900 h-[32rem] flex items-center justify-center">
              <div className="text-center p-8">
                <p className="text-gray-400 text-lg">Stellar Astro Interface</p>
                <p className="text-gray-500 text-sm mt-2">Screenshot placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 