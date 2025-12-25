export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  ARCHIVED = 'ARCHIVED',
}

export interface RaciRoles {
  responsible: string[]; // Who does the work
  accountable: string;   // Who signs off (usually one person)
  consulted: string[];   // Who gives input
  informed: string[];    // Who needs updates
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  previousStatus?: TaskStatus;
  roles: RaciRoles;
  dueDate?: string;
}

export type RaciRoleType = 'R' | 'A' | 'C' | 'I';

export interface ProjectSuggestion {
  title: string;
  description: string;
  roles: RaciRoles;
}