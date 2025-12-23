import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';

interface DroppableZoneProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const DroppableZone = ({ id, children, className = '' }: DroppableZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'ring-2 ring-brand-500 bg-brand-900/30' : ''}`}
    >
      {children}
    </div>
  );
};

