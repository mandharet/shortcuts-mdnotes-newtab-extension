import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Bars3Icon, PencilSquareIcon } from '@heroicons/react/24/outline';

interface CardProps {
  id: string;
  index: number;
  title: string;
  url: string;
  backgroundColor: string;
  onEdit: (id: string) => void;
  isEditMode: boolean;
}

const Card: React.FC<CardProps> = ({
  id,
  index,
  title,
  url,
  backgroundColor,
  onEdit,
  isEditMode,
}) => {

  const getSafeUrl = (url: string) => {
    if (!/^https?:\/\//i.test(url)) {
      return 'https://' + url;
    }
    return url;
  };

  const handleClick = (e?: React.MouseEvent) => {
    if (isEditMode || !url) {
      e?.preventDefault();
      return;
    }
    const safeUrl = getSafeUrl(url);
    if (e?.ctrlKey) {
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.open(safeUrl, '_self', 'noopener,noreferrer');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEdit(id);
    }
  };

  return (
    <Draggable draggableId={id} index={index} isDragDisabled={!isEditMode}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.dragHandleProps}
          {...provided.draggableProps}
          className={`card relative p-4 rounded-lg cursor-pointer group flex flex-col transition-all duration-200 hover:shadow-lg ${backgroundColor ? '' : 'bg-primary'}`}
          style={{
            ...(backgroundColor ? { backgroundColor } : {}),
            ...provided.draggableProps.style,
            transform: provided.draggableProps.style?.transform,
            transition: 'transform 0.2s ease'
          }}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          tabIndex={0}
        >
          <div className="flex justify-between gap-4 overflow-hidden">
            {isEditMode && (
              <div
                {...provided.dragHandleProps}
                title="Drag to reorder"
                className="cursor-move"
                onClick={e => e.stopPropagation()}
              >
                <Bars3Icon className="w-5 h-5" />
              </div>
            )}
            <h3 className="text-lg font-medium ">{title}</h3>
            {isEditMode && (
              <div>
                <button
                  className="p-1 rounded-full "
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(id);
                  }}
                >
                  <PencilSquareIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default Card; 