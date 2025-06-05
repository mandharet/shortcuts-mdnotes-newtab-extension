import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Cog6ToothIcon, Bars3Icon, PencilIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

interface CardProps {
  id: string;
  index: number;
  title: string;
  url: string;
  backgroundColor: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
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
  onColorChange,
  isEditMode,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const getSafeUrl = (url: string) => {
    if (!/^https?:\/\//i.test(url)) {
      return 'https://' + url;
    }
    return url;
  };

  const handleClick = (e?: React.MouseEvent) => {
    // Open URL on click if not in edit mode
    if (!isEditMode && url) {
      const safeUrl = getSafeUrl(url);
      window.location.href = safeUrl; // Open in the same window
    }
    // Prevent opening URL if in edit mode or no URL exists
    if (isEditMode || !url) {
      e?.preventDefault();
    }
  };

  React.useEffect(() => {
    if (!showMenu) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const menu = document.getElementById(`card-menu-${id}`);
      if (menu && !menu.contains(e.target as Node)) setShowMenu(false);
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMenu(false);
    };
    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [showMenu, id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowMenu(false);
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
                    setShowMenu(!showMenu);
                  }}
                >
                  <PencilSquareIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {showMenu && isEditMode && (
            <div
              id={`card-menu-${id}`}
              className="modal absolute right-0 mt-2 w-48 rounded-md z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-hover-bg "
                  onClick={() => onEdit(id)}
                >
                  Edit
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-hover-bg "
                  onClick={() => onDelete(id)}
                >
                  Delete
                </button>
                <div className="px-4 py-2 border-t border-border-color">
                  <label className="block text-sm mb-1 ">Background Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => onColorChange(id, e.target.value)}
                      className="w-full h-8 border border-border-color rounded"
                    />
                    <button
                      onClick={() => onColorChange(id, 'var(--bg-surface)')}
                      className="px-2 py-1 text-xs border border-border-color rounded hover:bg-hover-bg"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default Card; 