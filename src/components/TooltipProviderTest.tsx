import * as React from 'react';
import { TooltipProvider } from './ui/tooltip';

export default function TooltipProviderTest() {
  return (
    <TooltipProvider>
      <div>TooltipProvider is working!</div>
    </TooltipProvider>
  );
} 