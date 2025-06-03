import React from 'react';
import { Droppable, DragDropContext, DropResult, Draggable } from 'react-beautiful-dnd';
import Card from '../Card/Card';
import { PlusIcon, Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSettingsStore } from '../../stores/settingsStore';

export interface CardData {
  id: string;
  title: string;
  url: string;
  backgroundColor: string;
}

interface CardGridProps {
  columns: number;
}

const CardGrid: React.FC<CardGridProps> = ({ columns }) => {
  const [cards, setCards] = React.useState<CardData[]>([] as CardData[]);
  const [isAddingCard, setIsAddingCard] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [newCard, setNewCard] = React.useState<Partial<CardData>>({});
  const [editingCardId, setEditingCardId] = React.useState<string | null>(null);
  const { shortcuts, setShortcuts, updateFileSettings } = useSettingsStore();

  // Load shortcuts on mount
  React.useEffect(() => {
    setCards(shortcuts || []);
  }, [shortcuts]);

  const saveShortcuts = async (updatedCards: CardData[]) => {
    try {
      setShortcuts(updatedCards);
      await updateFileSettings({ shortcuts: updatedCards });
    } catch (error) {
      console.error('Failed to save cards (shortcuts) to settings:', error);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !isEditMode) return;

    const reordered = Array.from(cards);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    // Update state immediately for visual feedback
    setCards(reordered);

    // Save to storage asynchronously
    await saveShortcuts(reordered);
  };

  const handleAddOrEditCard = async () => {
    if (newCard.title && newCard.url) {
      if (editingCardId) {
        const updatedCards = cards.map(card =>
          card.id === editingCardId ? { ...card, ...newCard } : card
        );
        setCards(updatedCards);
        await saveShortcuts(updatedCards);
      } else {
        const card: CardData = {
          id: Date.now().toString(),
          title: newCard.title,
          url: newCard.url,
          backgroundColor: newCard.backgroundColor || '',
        };
        const updatedCards = [...cards, card];
        setCards(updatedCards);
        await saveShortcuts(updatedCards);
      }
      setIsAddingCard(false);
      setNewCard({});
      setEditingCardId(null);
    }
  };

  const handleEditCard = (id: string) => {
    const card = cards.find((c) => c.id === id);
    if (card) {
      setNewCard(card);
      setIsAddingCard(true);
      setEditingCardId(id);
    }
  };

  const handleDeleteCard = async (id: string) => {
    const updatedCards = cards.filter((card) => card.id !== id);
    setCards(updatedCards);
    await saveShortcuts(updatedCards);
  };

  const handleColorChange = async (id: string, color: string) => {
    const updatedCards = cards.map((card) =>
      card.id === id ? { ...card, backgroundColor: color } : card
    );
    setCards(updatedCards);
    await saveShortcuts(updatedCards);
  };

  React.useEffect(() => {
    if (!isAddingCard) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAddingCard(false);
      if (e.key === 'Enter') handleAddOrEditCard();
    };
    const handleClick = (e: MouseEvent) => {
      const modal = document.getElementById('add-edit-card-modal');
      if (modal && !modal.contains(e.target as Node)) setIsAddingCard(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClick);
    };
  }, [isAddingCard, newCard]);

  const totalCards = cards.length;
  const cellsPerRow = columns;
  const rows = Math.ceil(totalCards / cellsPerRow);
  const maxRows = rows + 1;
  const totalCells = maxRows * cellsPerRow;
  const gridItems = Array.from({ length: totalCells }, (_, i) => cards[i] || null);

  return (
    <div className="container mx-auto p-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="card-grid" direction="horizontal">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`grid gap-4 transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-surface/20' : ''}`}
              style={{ 
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                minHeight: '100px'
              }}
            >
              {cards.length > 0 ? (
                gridItems.map((card, index) =>
                  card ? (
                    <Card
                      key={card.id}
                      id={card.id}
                      index={index}
                      title={card.title}
                      url={card.url}
                      backgroundColor={card.backgroundColor}
                      onEdit={handleEditCard}
                      onDelete={handleDeleteCard}
                      onColorChange={handleColorChange}
                      isEditMode={isEditMode}
                    />
                  ) : (
                    <div 
                      key={`empty-${index}`} 
                      className={`h-24 bg-transparent border border-dashed border-gray-200 rounded flex items-center justify-center opacity-50 ${snapshot.isDraggingOver ? 'bg-surface/10' : ''}`}
                    >
                      {isEditMode && (
                        <span className="text-sm text-gray-400">Drop here</span>
                      )}
                    </div>
                  )
                )
              ) : (
                isEditMode && <div className="text-white">Loading cards...</div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {isAddingCard ? (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50">
          <div id="add-edit-card-modal" className="modal p-6 rounded-lg w-96">
            <input
              type="text"
              placeholder="Title"
              value={newCard.title || ''}
              onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
              className="w-full mb-4 p-2 border rounded"
              onKeyDown={e => { if (e.key === 'Enter') handleAddOrEditCard(); }}
            />
            <input
              type="url"
              placeholder="URL"
              value={newCard.url || ''}
              onChange={(e) => setNewCard({ ...newCard, url: e.target.value })}
              className="w-full mb-4 p-2 border rounded"
              onKeyDown={e => { if (e.key === 'Enter') handleAddOrEditCard(); }}
            />
            <input
              type="color"
              value={newCard.backgroundColor || '#ffffff'}
              onChange={(e) => setNewCard({ ...newCard, backgroundColor: e.target.value })}
              className="w-full mb-4 border rounded"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAddingCard(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOrEditCard}
                className="px-4 py-2 bg-primary rounded hover:bg-primary/90"
              >
                {editingCardId ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-end mt-4 gap-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className="p-2 rounded-full hover:bg-gray-100"
            title={isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
          >
            <Cog6ToothIcon className="w-6 h-6" />
          </button>
          {isEditMode && (
            <button
              onClick={() => setIsAddingCard(true)}
              className="p-2 rounded-full hover:bg-gray-100"
              title="Add New Card"
            >
              <PlusIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CardGrid; 