import React from 'react';
import { Compass, Sparkles } from 'lucide-react';
import { DASHBOARD_TOUR_STEPS, ICON_SIZES } from '../constants';
import type { DashboardTourStep } from '../types';

/**
 * TourContentService - Manages tour content, step definitions, and content utilities
 * Provides methods for creating, validating, and managing tour step content
 */
export class TourContentService {
  /**
   * Create default tour steps for dashboard
   * @returns Array of default dashboard tour steps
   */
  static createDefaultSteps(): DashboardTourStep[] {
    return [
      {
        title: "Navigation Sidebar",
        content: React.createElement(
          'div',
          { className: "space-y-2" },
          React.createElement(
            'p',
            { className: "text-sm text-muted-foreground" },
            "Access all your important sections from here. Click on any icon to navigate to that section."
          )
        ),
        selectorId: DASHBOARD_TOUR_STEPS.SIDEBAR_NAVIGATION,
        position: "right",
        icon: React.createElement(Compass, { className: `${ICON_SIZES.LARGE} text-primary` }),
      },
      {
        title: "Analytics Overview",
        content: React.createElement(
          'div',
          { className: "space-y-2" },
          React.createElement(
            'p',
            { className: "text-sm text-muted-foreground" },
            "Get a quick snapshot of your key metrics and performance indicators. Hover over charts for more details."
          )
        ),
        selectorId: DASHBOARD_TOUR_STEPS.ANALYTICS_OVERVIEW,
        position: "bottom",
        icon: React.createElement(Sparkles, { className: `${ICON_SIZES.LARGE} text-primary` }),
      },
      {
        title: "Quick Actions",
        content: React.createElement(
          'div',
          { className: "space-y-2" },
          React.createElement(
            'p',
            { className: "text-sm text-muted-foreground" },
            "Perform common tasks without navigating away from the dashboard. Try clicking on any action button."
          )
        ),
        selectorId: DASHBOARD_TOUR_STEPS.QUICK_ACTIONS,
        position: "bottom",
      },
      {
        title: "Recent Activity",
        content: React.createElement(
          'div',
          { className: "space-y-2" },
          React.createElement(
            'p',
            { className: "text-sm text-muted-foreground" },
            "Stay updated with the latest changes and activities. Click on any item to see more details."
          )
        ),
        selectorId: DASHBOARD_TOUR_STEPS.RECENT_ACTIVITY,
        position: "top",
      },
      {
        title: "User Settings",
        content: React.createElement(
          'div',
          { className: "space-y-2" },
          React.createElement(
            'p',
            { className: "text-sm text-muted-foreground" },
            "Customize your experience and manage your account preferences from here."
          )
        ),
        selectorId: DASHBOARD_TOUR_STEPS.USER_SETTINGS,
        position: "left",
      },
    ];
  }

  /**
   * Validate tour steps array
   * @param steps - Array of tour steps to validate
   * @returns Boolean indicating if steps are valid
   */
  static validateSteps(steps: DashboardTourStep[]): boolean {
    if (!Array.isArray(steps) || steps.length === 0) {
      console.warn('TourContentService: Steps array is empty or not an array');
      return false;
    }

    const isValid = steps.every((step, index) => {
      if (!step) {
        console.warn(`TourContentService: Step at index ${index} is null or undefined`);
        return false;
      }

      if (typeof step.title !== 'string' || step.title.trim() === '') {
        console.warn(`TourContentService: Step at index ${index} has invalid title`);
        return false;
      }

      if (typeof step.selectorId !== 'string' || step.selectorId.trim() === '') {
        console.warn(`TourContentService: Step at index ${index} has invalid selectorId`);
        return false;
      }

      if (step.content === undefined || step.content === null) {
        console.warn(`TourContentService: Step at index ${index} has no content`);
        return false;
      }

      if (step.position && !['top', 'bottom', 'left', 'right'].includes(step.position)) {
        console.warn(`TourContentService: Step at index ${index} has invalid position`);
        return false;
      }

      return true;
    });

    return isValid;
  }

  /**
   * Get step content with fallback
   * @param step - Tour step
   * @returns React node content or fallback content
   */
  static getStepContent(step: DashboardTourStep): React.ReactNode {
    if (!step || !step.content) {
      return React.createElement(
        'div',
        { className: "text-muted-foreground" },
        "No content available for this step."
      );
    }
    return step.content;
  }

  /**
   * Get step icon with fallback
   * @param step - Tour step
   * @returns React node icon or default icon
   */
  static getStepIcon(step: DashboardTourStep): React.ReactNode {
    if (!step || !step.icon) {
      return React.createElement(Compass, { className: `${ICON_SIZES.LARGE} text-primary` });
    }
    return step.icon;
  }

  /**
   * Create a simple text content step
   * @param text - Text content for the step
   * @param className - Optional CSS class for styling
   * @returns React node with text content
   */
  static createTextContent(text: string, className: string = "text-sm text-muted-foreground"): React.ReactNode {
    return React.createElement(
      'div',
      { className: "space-y-2" },
      React.createElement('p', { className }, text)
    );
  }

  /**
   * Create rich content with title and description
   * @param title - Content title
   * @param description - Content description
   * @param additionalContent - Optional additional content
   * @returns React node with rich content
   */
  static createRichContent(
    title: string,
    description: string,
    additionalContent?: React.ReactNode
  ): React.ReactNode {
    return React.createElement(
      'div',
      { className: "space-y-3" },
      React.createElement('h4', { className: "font-medium text-sm" }, title),
      React.createElement('p', { className: "text-sm text-muted-foreground" }, description),
      additionalContent
    );
  }

  /**
   * Create content with list items
   * @param items - Array of list items
   * @param ordered - Whether to use ordered list
   * @returns React node with list content
   */
  static createListContent(items: string[], ordered: boolean = false): React.ReactNode {
    const listElement = ordered ? 'ol' : 'ul';
    const listClass = ordered ? "list-decimal list-inside space-y-1" : "list-disc list-inside space-y-1";

    return React.createElement(
      'div',
      { className: "space-y-2" },
      React.createElement(
        listElement,
        { className: listClass },
        ...items.map((item, index) =>
          React.createElement('li', { key: index, className: "text-sm text-muted-foreground" }, item)
        )
      )
    );
  }

  /**
   * Filter steps by position
   * @param steps - Array of tour steps
   * @param position - Position to filter by
   * @returns Filtered array of steps
   */
  static filterStepsByPosition(
    steps: DashboardTourStep[],
    position: 'top' | 'bottom' | 'left' | 'right'
  ): DashboardTourStep[] {
    return steps.filter(step => step.position === position);
  }

  /**
   * Get steps that target specific selector IDs
   * @param steps - Array of tour steps
   * @param selectorIds - Array of selector IDs to match
   * @returns Filtered array of steps
   */
  static getStepsBySelectorIds(steps: DashboardTourStep[], selectorIds: string[]): DashboardTourStep[] {
    return steps.filter(step => selectorIds.includes(step.selectorId));
  }

  /**
   * Clone and modify a step
   * @param step - Original step to clone
   * @param modifications - Properties to modify
   * @returns New step with modifications
   */
  static cloneStep(
    step: DashboardTourStep,
    modifications: Partial<DashboardTourStep>
  ): DashboardTourStep {
    return {
      ...step,
      ...modifications,
    };
  }

  /**
   * Merge multiple step arrays
   * @param stepArrays - Arrays of steps to merge
   * @returns Combined array of steps
   */
  static mergeSteps(...stepArrays: DashboardTourStep[][]): DashboardTourStep[] {
    return stepArrays.flat();
  }
} 