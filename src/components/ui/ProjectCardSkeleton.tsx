import React from 'react';
import { motion } from 'framer-motion';

const ProjectCardSkeleton: React.FC = () => (
  <div className="animate-pulse w-full max-w-4xl bg-gray-900/80 border border-gray-800 rounded-3xl overflow-hidden shadow-lg flex flex-col">
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="relative flex-1 min-h-[266px] max-h-[400px] bg-gray-800">
        <div className="w-full h-full min-h-[266px] max-h-[400px] bg-gray-700 shimmer" />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2/3 h-8 bg-gray-700 rounded-lg shimmer" />
      </div>
      <div className="bg-primary text-primary-foreground p-1.5 flex flex-col gap-1.5 rounded-b-3xl text-sm">
        <div className="flex items-center justify-between mb-0.5">
          <div className="h-4 w-24 bg-gray-700 rounded shimmer" />
          <div className="h-4 w-12 bg-gray-700 rounded shimmer" />
        </div>
        <div className="flex flex-col gap-0.5 text-[11px] mb-1">
          <div className="flex items-center gap-2">
            <div className="h-3 w-16 bg-gray-700 rounded shimmer" />
            <div className="h-3 w-16 bg-gray-700 rounded shimmer" />
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 my-0.5" />
        <div className="flex flex-wrap gap-1.5 mb-1 justify-center">
          <div className="h-4 w-16 bg-gray-700 rounded-full shimmer" />
          <div className="h-4 w-12 bg-gray-700 rounded-full shimmer" />
        </div>
        <div className="flex items-center justify-between mt-0.5 flex-wrap gap-1.5">
          <div className="flex flex-row gap-3 text-xs">
            <div className="h-3 w-10 bg-gray-700 rounded shimmer" />
            <div className="h-3 w-10 bg-gray-700 rounded shimmer" />
          </div>
          <div className="flex gap-1.5 ml-auto">
            <div className="h-8 w-8 bg-gray-700 rounded-full shimmer" />
            <div className="h-8 w-8 bg-gray-700 rounded-full shimmer" />
            <div className="h-8 w-8 bg-gray-700 rounded-full shimmer" />
          </div>
        </div>
      </div>
    </motion.div>
  </div>
);

export default ProjectCardSkeleton; 