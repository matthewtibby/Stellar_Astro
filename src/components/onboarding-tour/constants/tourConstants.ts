// Tour Step Constants
export const DASHBOARD_TOUR_STEPS = {
  SIDEBAR_NAVIGATION: "sidebar-navigation",
  ANALYTICS_OVERVIEW: "analytics-overview",
  QUICK_ACTIONS: "quick-actions",
  RECENT_ACTIVITY: "recent-activity",
  USER_SETTINGS: "user-settings",
} as const;

// Animation Constants
export const ANIMATION_CONFIG = {
  OVERLAY: {
    INITIAL: { opacity: 0 },
    ANIMATE: { opacity: 1 },
    EXIT: { opacity: 0 },
  },
  MODAL: {
    INITIAL: { opacity: 0, scale: 0.95 },
    ANIMATE: { opacity: 1, scale: 1 },
    EXIT: { opacity: 0, scale: 0.95 },
  },
  CONTENT: {
    INITIAL: { opacity: 0, scale: 0.95 },
    ANIMATE: { opacity: 1, scale: 1 },
    EXIT: { opacity: 0, scale: 0.95 },
    TRANSITION: {
      duration: 0.2,
      height: { duration: 0.4 },
    },
  },
  WELCOME_DIALOG: {
    INITIAL: { scale: 0.7, filter: "blur(10px)" },
    ANIMATE: {
      scale: 1,
      filter: "blur(0px)",
      y: [0, -8, 0],
    },
    TRANSITION: {
      duration: 0.4,
      ease: "easeOut",
      y: {
        duration: 2.5,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
  },
  COMPASS: {
    INITIAL: { scale: 0.7 },
    ANIMATE: { scale: 1, y: [0, -8, 0] },
    TRANSITION: {
      duration: 0.4,
      ease: "easeOut",
      y: {
        duration: 2.5,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
  },
  SPARKLES: {
    INITIAL: { opacity: 0 },
    ANIMATE: { opacity: 1, rotate: [0, 360] },
    TRANSITION: {
      delay: 0.3,
      duration: 0.5,
      rotate: {
        duration: 20,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
      },
    },
  },
  CONFETTI: {
    SHOW_DURATION: 3000,
    PARTICLE_COUNT: 100,
    FALL_DURATION: { min: 2, max: 4 },
    DELAY_MAX: 0.5,
  },
} as const;

// CSS Classes
export const CSS_CLASSES = {
  // Overlay and backdrop
  OVERLAY: "fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-[2px]",
  BACKDROP: "fixed inset-0 bg-black/50 backdrop-blur-[2px]",
  
  // Modal and content
  MODAL_CONTAINER: "fixed inset-0 overflow-hidden",
  MODAL_WRAPPER: "foo", // Placeholder class from original
  MODAL_CONTENT: "bg-background relative rounded-lg border p-5 shadow-lg",
  
  // Welcome dialog
  WELCOME_CONTAINER: "fixed inset-0 flex items-center justify-center",
  WELCOME_MODAL: "fixed inset-0 z-[100] rounded-md border-2 border-primary",
  WELCOME_HEADER: "relative mb-4",
  WELCOME_TEXT_CENTER: "text-center",
  WELCOME_TITLE: "text-2xl font-medium mb-4",
  WELCOME_DESCRIPTION: "text-muted-foreground mb-6",
  WELCOME_BUTTONS: "space-x-2",
  
  // Navigation and controls
  CLOSE_BUTTON: "absolute right-2 top-2",
  HEADER_SECTION: "mb-4 flex items-center gap-3",
  TITLE: "font-semibold",
  CONTENT_SECTION: "mt-5 flex flex-col gap-3",
  PROGRESS_BAR: "h-1 bg-primary rounded-full overflow-hidden",
  PROGRESS_FILL: "h-1 bg-primary/50",
  
  // Step indicators
  STEP_INDICATORS: "flex gap-1",
  STEP_DOT: "h-1.5 w-1.5 rounded-full",
  STEP_ACTIVE: "bg-primary",
  STEP_COMPLETED: "bg-primary/50",
  STEP_INACTIVE: "bg-muted",
  
  // Navigation buttons
  NAVIGATION_SECTION: "flex items-center justify-between",
  NAVIGATION_BUTTONS: "flex gap-2",
  BACK_BUTTON: "h-8",
  NEXT_BUTTON: "h-8",
  
  // Primary action buttons
  START_BUTTON: "px-4 py-2 bg-primary text-white rounded-md",
  SKIP_BUTTON: "px-4 py-2 bg-muted text-muted-foreground rounded-md",
  
  // Example/demo layout
  DEMO_CONTAINER: "container mx-auto p-10",
  DEMO_CONTENT: "space-y-8",
  DEMO_HEADER: "space-y-2",
  DEMO_TITLE: "text-3xl font-bold",
  DEMO_DESCRIPTION: "text-muted-foreground",
  DEMO_GRID: "grid gap-8",
  DEMO_ITEM: "border rounded-lg p-6 bg-muted/30",
  DEMO_ITEM_TEXT: "text-muted-foreground text-sm",
  
  // Confetti
  CONFETTI_CONTAINER: "fixed inset-0 pointer-events-none z-[1000] overflow-hidden",
  CONFETTI_PARTICLE: "absolute w-2 h-2 rounded-full",
} as const;

// UI Text Constants
export const UI_TEXT = {
  WELCOME: {
    TITLE: "Welcome to Your Dashboard",
    DESCRIPTION: "Let's take a quick tour to help you get familiar with all the features and make the most of your experience.",
    START_BUTTON: "Start Tour",
    SKIP_BUTTON: "Skip for Now",
  },
  NAVIGATION: {
    BACK: "Back",
    NEXT: "Next",
    FINISH: "Finish",
  },
  DEMO: {
    TITLE: "Dashboard",
    DESCRIPTION: "Welcome to your dashboard. Here's an overview of your account.",
    SECTIONS: {
      SIDEBAR_NAVIGATION: "Sidebar Navigation",
      ANALYTICS_OVERVIEW: "Analytics Overview", 
      QUICK_ACTIONS: "Quick Actions",
      RECENT_ACTIVITY: "Recent Activity",
      USER_SETTINGS: "User Settings",
    },
  },
  ARIA_LABELS: {
    CLOSE_TOUR: "Close tour",
    GO_TO_STEP: "Go to step",
    BACK_STEP: "Go to previous step",
    NEXT_STEP: "Go to next step",
    FINISH_TOUR: "Finish tour",
  },
} as const;

// Tour Configuration
export const TOUR_CONFIG = {
  DEFAULT_POSITION: "bottom" as const,
  MIN_CONTENT_HEIGHT: 80,
  Z_INDEX: {
    OVERLAY: 50,
    WELCOME_MODAL: 100,
    CONFETTI: 1000,
  },
  BLUR_FILTERS: {
    ACTIVE: "blur(0px)",
    INACTIVE: "blur(4px)",
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  HOOK_OUTSIDE_PROVIDER: "useDashboardTour must be used within a DashboardTourProvider",
  ELEMENT_NOT_FOUND: "Tour target element not found",
  INVALID_STEP_INDEX: "Invalid step index provided",
} as const;

// Icon Sizes
export const ICON_SIZES = {
  SMALL: "h-3 w-3",
  MEDIUM: "h-4 w-4", 
  LARGE: "h-5 w-5",
  EXTRA_LARGE: "h-6 w-6",
  COMPASS: "h-24 w-24",
} as const; 