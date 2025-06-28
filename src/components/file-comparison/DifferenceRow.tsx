import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ComparisonResult } from './useFileComparison';

interface DifferenceRowProps {
  diff: ComparisonResult['differences'][number];
}

const DifferenceRow: React.FC<DifferenceRowProps> = ({ diff }) => (
  <div className="p-2 bg-gray-700/50 rounded-md text-sm">
    <div className="flex items-center space-x-2">
      <AlertCircle className="h-4 w-4 text-yellow-500" />
      <span className="text-gray-300">{diff.field}:</span>
      <span className="text-red-400">{typeof diff.value1 === 'object' ? JSON.stringify(diff.value1) : String(diff.value1 ?? '')}</span>
      <span className="text-gray-400">→</span>
      <span className="text-green-400">{typeof diff.value2 === 'object' ? JSON.stringify(diff.value2) : String(diff.value2 ?? '')}</span>
    </div>
  </div>
);

export default DifferenceRow; 