import React from 'react';
import { Droppable, DragDropContext, DropResult } from 'react-beautiful-dnd';
import { PlusIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useSettingsStore } from '../../stores/settingsStore';
import { logger } from '../../utils/logger';
import Card from './Card/Card';

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
  const { shortcuts, setShortcuts, updateFileSettings, isPinnedBookMarkFlyout } = useSettingsStore();

  // Load shortcuts on mount
  React.useEffect(() => {
    setCards(shortcuts || []);
  }, [shortcuts]);

  const saveShortcuts = async (updatedCards: CardData[]) => {
    try {
      setShortcuts(updatedCards);
      await updateFileSettings({ shortcuts: updatedCards });
    } catch (error) {
      logger.error('Failed to save cards (shortcuts) to settings:', error);
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

  const handleConfirmDeleteFromModal = async () => {
    if (editingCardId) {
      await handleDeleteCard(editingCardId);
      setIsAddingCard(false); // Close the modal
      setEditingCardId(null); // Clear editing state
      setNewCard({}); // Clear new card state
    }
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
  const totalCells = cards.length + 1;//maxRows * cellsPerRow;
  const gridItems = Array.from({ length: totalCells }, (_, i) => cards[i] || null);

  return (
    <div className="container mx-auto p-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="card-grid" direction="vertical">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`grid gap-4 transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-surface/20' : ''}`}
              style={{
                gridTemplateColumns: isEditMode ? '1fr' : `repeat(${columns}, minmax(0, 1fr))`,
                minHeight: '50px',
                maxWidth: isEditMode ? '30vw' : 'none',
                margin: isEditMode ? '0 auto' : '0'
              }}
            >
              {
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
                      isEditMode={isEditMode}
                    />
                  ) : (
                    <>
                      <div
                        key={`empty-${index}`}
                        className={`h-16 text-lg cursor-pointer border border-dashed rounded flex items-center justify-center ${snapshot.isDraggingOver ? 'bg-surface/10' : ''}`}
                        onClick={() => setIsAddingCard(true)}
                      > <PlusIcon className="w-6 h-6" />&nbsp;&nbsp;Create shortcut
                      </div>
                      {(totalCards > 0 &&
                        <div
                          key={`empty-${index}`}
                          className={`h-16 text-lg cursor-pointer border border-dashed rounded flex items-center justify-center ${snapshot.isDraggingOver ? 'bg-surface/10' : ''}`}
                          onClick={() => setIsEditMode(!isEditMode)}
                        >
                          <Cog6ToothIcon className="w-6 h-6" />&nbsp;&nbsp;
                          Settings
                        </div>)}
                    </>
                  )
                )
              }
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {isAddingCard && (
        <div className={`fixed inset-0 modal-overlay flex items-center justify-center z-50 ${isPinnedBookMarkFlyout ? 'max-w-[60vw]' : 'mx-auto'}`}>
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
              placeholder="some.URL.com"
              value={newCard.url || ''}
              onChange={(e) => setNewCard({ ...newCard, url: e.target.value })}
              className="w-full mb-4 p-2 border rounded"
              onKeyDown={e => { if (e.key === 'Enter') handleAddOrEditCard(); }}
            />
            <div className='flex flex-col'>
              <div>Background Color: </div>
              <input
                type="color"
                value={newCard.backgroundColor || '#ffffff'}
                onChange={(e) => setNewCard({ ...newCard, backgroundColor: e.target.value })}
                className="w-full mb-4 border rounded"
              />
            </div>
            <div className="flex justify-between gap-2">
              {editingCardId && <button
                onClick={handleConfirmDeleteFromModal}
                className="px-4 py-2 rounded btn-delete"
              >
                Delete
              </button>}
              <div>
                <button
                  onClick={() => setIsAddingCard(false)}
                  className="px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOrEditCard}
                  className="px-4 py-2 rounded card"
                >
                  {editingCardId ? 'Save' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>

      )}
    </div>
  );
};

export default CardGrid; 