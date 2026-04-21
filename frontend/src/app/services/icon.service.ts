import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IconService {
  readonly availableIcons = [
    { id: 'bug-icon', name: 'Bug', icon: 'bug' },
    { id: 'task-icon', name: 'Task', icon: 'check-square' },
    { id: 'story-icon', name: 'Story', icon: 'book-open' },
    { id: 'epic-icon', name: 'Epic', icon: 'zap' },
    { id: 'star-icon', name: 'Feature', icon: 'star' },
    { id: 'alert-triangle-icon', name: 'Urgent', icon: 'alert-triangle' },
    { id: 'flag-icon', name: 'Milestone', icon: 'flag' },
    { id: 'target-icon', name: 'Goal', icon: 'target' },
    { id: 'shield-icon', name: 'Security', icon: 'shield' },
    { id: 'rocket-icon', name: 'Performance', icon: 'rocket' },
    { id: 'flame-icon', name: 'Hotfix', icon: 'flame' },
    { id: 'clock-icon', name: 'Time', icon: 'clock' }
  ];

  getIconName(dbIconName: string | null | undefined): string {
    if (!dbIconName) return 'bookmark';

    const mapping: { [key: string]: string } = {
      'task-icon': 'check-square',
      'story-icon': 'book-open',
      'epic-icon': 'zap',
      'star-icon': 'star',
      'alert-triangle-icon': 'alert-triangle',
      'flag-icon': 'flag',
      'target-icon': 'target',
      'shield-icon': 'shield',
      'rocket-icon': 'rocket',
      'flame-icon': 'flame',
      'clock-icon': 'clock'
    };

    return mapping[dbIconName] || dbIconName.replace('-icon', '');
  }
}