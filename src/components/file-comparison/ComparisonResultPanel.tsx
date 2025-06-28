import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import DifferenceRow from './DifferenceRow';
import { ComparisonResult } from './useFileComparison';

interface ComparisonResultPanelProps {
  result: ComparisonResult;
  expanded: boolean;
  onToggle: () => void;
}

const ComparisonResultPanel: React.FC<ComparisonResultPanelProps> = ({ result, expanded, onToggle }) => (
  <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
    <div className="flex items-center justify-between cursor-pointer" onClick={onToggle}>
      <div className="flex items-center space-x-2">
        <span className="text-white">{result.file1} vs {result.file2}</span>
        <span className={`text-sm ${
          result.similarity > 80 ? 'text-green-500' :
          result.similarity > 50 ? 'text-yellow-500' :
          'text-red-500'
        }`}>
          ({result.similarity.toFixed(1)}% similar)
        </span>
      </div>
      {expanded ? (
        <ChevronDown className="h-5 w-5 text-gray-400" />
      ) : (
        <ChevronRight className="h-5 w-5 text-gray-400" />
      )}
    </div>
    {expanded && (
      <div className="mt-4 space-y-2">
        {result.differences.map((diff, i) => (
          <DifferenceRow key={i} diff={diff} />
        ))}
      </div>
    )}
  </div>
);

export default ComparisonResultPanel; 