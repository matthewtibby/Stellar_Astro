// Quality score thresholds
export const QUALITY_THRESHOLDS = {
  EXCELLENT: 8,
  GOOD: 6,
  MODERATE: 4,
} as const;

// Quality color mappings
export const QUALITY_COLORS = {
  EXCELLENT: 'text-green-400',
  GOOD: 'text-yellow-400',
  MODERATE: 'text-orange-400',
  POOR: 'text-red-400',
} as const;

// Status text mappings
export const STATUS_TEXT = {
  EXCELLENT: '✅ Excellent',
  GOOD: '⚠️ Good',
  MODERATE: '⚠️ Moderate',
  POOR: '❌ Poor',
} as const;

// Distribution type icons
export const DISTRIBUTION_ICONS = {
  normal: '📊',
  bimodal: '📈',
  right_clipped: '📉',
  left_clipped: '📈',
  skewed: '📊',
  default: '📋',
} as const;

// Common styling classes
export const STYLES = {
  // Background styles
  PANEL_BG: 'bg-gray-800 rounded-lg border border-gray-700 overflow-hidden',
  HEADER_BG: 'bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-4',
  FRAME_BG: 'bg-gray-900/50 rounded-lg p-3',
  STATS_BG: 'bg-gray-900/30 p-4 border-b border-gray-700',
  
  // Button styles
  ACTION_BUTTON: 'px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors',
  FRAME_BUTTON_BASE: 'p-1 rounded transition-colors',
  ACCEPT_BUTTON: 'bg-green-600/20 hover:bg-green-600/30 text-green-400',
  REJECT_BUTTON: 'bg-red-600/20 hover:bg-red-600/30 text-red-400',
  PEDESTAL_BUTTON: 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400',
  
  // Quality badges
  QUALITY_BADGE_BASE: 'px-2 py-1 rounded text-xs font-medium',
  EXCELLENT_BADGE: 'bg-green-900/50 text-green-300',
  GOOD_BADGE: 'bg-yellow-900/50 text-yellow-300',
  MODERATE_BADGE: 'bg-orange-900/50 text-orange-300',
  POOR_BADGE: 'bg-red-900/50 text-red-300',
  
  // Status indicators
  CLIPPING_INDICATOR: 'px-2 py-1 bg-red-900/30 text-red-300 rounded text-xs',
  PEDESTAL_INDICATOR: 'px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded text-xs',
  OUTLIER_INDICATOR: 'px-2 py-1 bg-orange-900/30 text-orange-300 rounded text-xs',
  SATURATION_INDICATOR: 'px-2 py-1 bg-purple-900/30 text-purple-300 rounded text-xs',
  
  // Layout styles
  GRID_OVERVIEW: 'mt-4 grid grid-cols-2 md:grid-cols-4 gap-4',
  GRID_STATS: 'grid grid-cols-2 md:grid-cols-4 gap-2 text-xs',
  SCROLLABLE_LIST: 'space-y-3 max-h-96 overflow-y-auto',
} as const; 