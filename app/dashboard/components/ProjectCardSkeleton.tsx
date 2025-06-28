import React from 'react';

const ProjectCardSkeleton: React.FC = () => (
  <div className="w-full max-w-[400px] min-h-[340px] max-h-[400px] bg-gray-900/80 border border-gray-800 rounded-3xl overflow-hidden shadow-lg flex flex-col animate-pulse">
    <div className="relative flex-1 min-h-[180px] max-h-[180px] aspect-square bg-gray-800 flex items-center justify-center">
      <div className="w-24 h-24 bg-gray-700 rounded-full" />
    </div>
    <div className="bg-primary text-primary-foreground p-1 flex flex-col gap-1 rounded-b-3xl text-xs">
      <div className="flex items-center justify-between mb-0.5">
        <div className="h-4 w-24 bg-gray-700 rounded" />
        <div className="h-4 w-16 bg-gray-700 rounded" />
      </div>
      <div className="flex flex-col gap-0.5 text-[10px] text-primary-foreground/80 mb-1 bg-primary/60 rounded-md px-1 py-0.5">
        <div className="h-3 w-20 bg-gray-700 rounded" />
      </div>
      <div className="border-t border-primary-foreground/20 my-0.5" />
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-1 justify-start items-center text-white text-xs font-medium">
        <div className="h-3 w-16 bg-gray-700 rounded" />
      </div>
      <div className="flex items-center justify-between mt-0.5 flex-wrap gap-1">
        <div className="flex flex-row gap-3 text-xs items-center">
          <div className="h-3 w-8 bg-gray-700 rounded" />
          <div className="h-3 w-8 bg-gray-700 rounded" />
        </div>
        <div className="flex gap-2 justify-center w-full">
          <div className="h-8 w-8 bg-gray-700 rounded-full" />
          <div className="h-8 w-8 bg-gray-700 rounded-full" />
          <div className="h-8 w-8 bg-gray-700 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

export default ProjectCardSkeleton; 