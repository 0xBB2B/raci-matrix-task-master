import React from 'react';
import { RACI_DEFINITIONS } from '../constants';
import { RaciRoleType } from '../types';

interface RaciBadgeProps {
  role: RaciRoleType;
  people: string[];
}

export const RaciBadge: React.FC<RaciBadgeProps> = ({ role, people }) => {
  const config = RACI_DEFINITIONS[role];
  const isEmpty = people.length === 0 || (people.length === 1 && people[0] === '');
  
  if (isEmpty) return null;

  return (
    <div className={`flex flex-col text-xs border rounded-md overflow-hidden ${config.color} shadow-sm`}>
      <div className="font-bold px-2 py-1 bg-white/50 dark:bg-black/20 border-b border-inherit flex items-center justify-between">
        <span>{role}</span>
        <span className="opacity-70 text-[10px] uppercase tracking-wider hidden sm:inline-block ml-2">{config.label}</span>
      </div>
      <div className="px-2 py-1.5 flex flex-wrap gap-1">
        {people.map((person, idx) => (
          <span key={idx} className="bg-white/80 dark:bg-white/10 dark:text-inherit px-1.5 py-0.5 rounded text-[11px] font-medium truncate max-w-[120px]">
            {person}
          </span>
        ))}
      </div>
    </div>
  );
};