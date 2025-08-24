import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CardProps {
  id: string;
  index: number;
  title: string;
  url: string;
  backgroundColor: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isEditMode: boolean;
}

const Card: React.FC<CardProps> = ({
  id,
  index,
  title,
  url,
  backgroundColor,
  onEdit,
  onDelete,
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
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M9.5 8C10.3284 8 11 7.32843 11 6.5C11 5.67157 10.3284 5 9.5 5C8.67157 5 8 5.67157 8 6.5C8 7.32843 8.67157 8 9.5 8ZM9.5 14C10.3284 14 11 13.3284 11 12.5C11 11.6716 10.3284 11 9.5 11C8.67157 11 8 11.6716 8 12.5C8 13.3284 8.67157 14 9.5 14ZM11 18.5C11 19.3284 10.3284 20 9.5 20C8.67157 20 8 19.3284 8 18.5C8 17.6716 8.67157 17 9.5 17C10.3284 17 11 17.6716 11 18.5ZM15.5 8C16.3284 8 17 7.32843 17 6.5C17 5.67157 16.3284 5 15.5 5C14.6716 5 14 5.67157 14 6.5C14 7.32843 14.6716 8 15.5 8ZM17 12.5C17 13.3284 16.3284 14 15.5 14C14.6716 14 14 13.3284 14 12.5C14 11.6716 14.6716 11 15.5 11C16.3284 11 17 11.6716 17 12.5ZM15.5 20C16.3284 20 17 19.3284 17 18.5C17 17.6716 16.3284 17 15.5 17C14.6716 17 14 17.6716 14 18.5C14 19.3284 14.6716 20 15.5 20Z" fill="#121923" />
                </svg>
              </div>
            )}
            <h3 className="text-lg font-medium " title={title}>
              {title.length > 30 ? title.slice(0, 30) + '…' : title}
            </h3>
            {isEditMode && (
              <div className='flex gap-2'>
                <button
                  className="p-1 rounded-full "
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(id);
                  }}
                >
                  <PencilSquareIcon className="w-5 h-5" />
                </button>
                <button
                  className="p-1 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(id);
                  }}
                >
                  <TrashIcon className='w-5 h-5' />
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