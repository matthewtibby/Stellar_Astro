export const notificationEvents = {
  // Project Events
  project_created: { enabled: true, label: 'Project created' },
  project_duplicated: { enabled: true, label: 'Project duplicated' },
  project_archived: { enabled: true, label: 'Project archived or deleted' },
  collaborator_changed: { enabled: true, label: 'Collaborator invited/added/removed' },
  project_shared: { enabled: true, label: 'Project shared with you' },

  // Collaboration/Sharing
  added_as_collaborator: { enabled: true, label: 'You were added as a collaborator' },
  invite_accepted: { enabled: true, label: 'Someone accepted your invite' },
  removed_from_project: { enabled: true, label: 'Someone removed you from a project' },

  // System/Account
  subscription_changed: { enabled: true, label: 'Subscription/plan changes' },
  account_changed: { enabled: true, label: 'Account changes' },
  system_alert: { enabled: true, label: 'System maintenance or downtime alerts' },

  // Other
  new_feature: { enabled: true, label: 'New feature announcements' },
  community_engagement: { enabled: true, label: 'Community engagement' },

  // All others OFF by default
  file_upload: { enabled: false, label: 'File upload completed' },
  batch_upload: { enabled: false, label: 'Batch upload completed' },
  file_deleted: { enabled: false, label: 'File deleted' },
  processing_step: { enabled: false, label: 'Processing step completed' },
  processing_failed: { enabled: false, label: 'Processing failed' },
  export_completed: { enabled: false, label: 'Export completed' },
};

export function shouldNotify(eventType: keyof typeof notificationEvents) {
  return notificationEvents[eventType]?.enabled;
} 