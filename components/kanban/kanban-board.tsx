"use client";

import { useEffect, useState } from "react";
import { useStorage, useMutation } from "@liveblocks/react/suspense";
import { LiveObject, LiveList } from "@liveblocks/client";
import { Plus, GripVertical, X, MoreVertical, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Types for Kanban data
type Card = {
  id: string;
  title: string;
  description: string;
  createdAt: number;
};

type Column = {
  id: string;
  title: string;
  cards: Card[];
};

export function KanbanBoard() {
  const [draggedCard, setDraggedCard] = useState<{
    card: Card;
    fromColumnId: string;
  } | null>(null);
  const [newCardColumnId, setNewCardColumnId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [editingCard, setEditingCard] = useState<{
    columnId: string;
    cardId: string;
  } | null>(null);
  const [editCardTitle, setEditCardTitle] = useState("");
  const [editCardDescription, setEditCardDescription] = useState("");

  // Get columns from Liveblocks storage
  const columns = useStorage((root) => root.columns);

  // Initialize columns if they don't exist
  const initializeColumns = useMutation(({ storage }) => {
    const columns = storage.get("columns");
    if (!columns || columns.length === 0) {
      const defaultColumns = new LiveList([
        new LiveObject({
          id: "todo",
          title: "To Do",
          cards: new LiveList(),
        }),
        new LiveObject({
          id: "in-progress",
          title: "In Progress",
          cards: new LiveList(),
        }),
        new LiveObject({
          id: "done",
          title: "Done",
          cards: new LiveList(),
        }),
      ]);
      storage.set("columns", defaultColumns);
    }
  }, []);

  // Add a card to a column
  const addCard = useMutation(
    ({ storage }, columnId: string, title: string) => {
      const columns = storage.get("columns");
      if (!columns) return;

      const columnIndex = columns
        .toArray()
        .findIndex((col: any) => col.get("id") === columnId);
      if (columnIndex === -1) return;

      const column = columns.get(columnIndex);
      if (!column) return;

      const cards = column.get("cards") as LiveList<LiveObject<Card>>;
      if (!cards) return;

      const newCard = new LiveObject({
        id: `card-${Date.now()}-${Math.random()}`,
        title,
        description: "",
        createdAt: Date.now(),
      });

      cards.push(newCard);
    },
    []
  );

  // Move a card between columns
  const moveCard = useMutation(
    ({ storage }, fromColumnId: string, toColumnId: string, card: Card) => {
      const columns = storage.get("columns");
      if (!columns) return;

      // Find source and destination columns
      const fromIndex = columns
        .toArray()
        .findIndex((col: any) => col.get("id") === fromColumnId);
      const toIndex = columns
        .toArray()
        .findIndex((col: any) => col.get("id") === toColumnId);

      if (fromIndex === -1 || toIndex === -1) return;

      const fromColumn = columns.get(fromIndex);
      const toColumn = columns.get(toIndex);

      if (!fromColumn || !toColumn) return;

      const fromCards = fromColumn.get("cards") as LiveList<LiveObject<Card>>;
      const toCards = toColumn.get("cards") as LiveList<LiveObject<Card>>;

      if (!fromCards || !toCards) return;

      // Remove card from source
      const cardIndex = fromCards
        .toArray()
        .findIndex((c: any) => c.get("id") === card.id);
      if (cardIndex !== -1) {
        fromCards.delete(cardIndex);
      }

      // Add card to destination
      const newCard = new LiveObject(card);
      toCards.push(newCard);
    },
    []
  );

  // Update a card
  const updateCard = useMutation(
    (
      { storage },
      columnId: string,
      cardId: string,
      updates: Partial<Card>
    ) => {
      const columns = storage.get("columns");
      if (!columns) return;

      const columnIndex = columns
        .toArray()
        .findIndex((col: any) => col.get("id") === columnId);
      if (columnIndex === -1) return;

      const column = columns.get(columnIndex);
      if (!column) return;

      const cards = column.get("cards") as LiveList<LiveObject<Card>>;
      if (!cards) return;

      const cardIndex = cards
        .toArray()
        .findIndex((c: any) => c.get("id") === cardId);
      if (cardIndex === -1) return;

      const card = cards.get(cardIndex);
      if (!card) return;

      Object.entries(updates).forEach(([key, value]) => {
        card.set(key as keyof Card, value);
      });
    },
    []
  );

  // Delete a card
  const deleteCard = useMutation(
    ({ storage }, columnId: string, cardId: string) => {
      const columns = storage.get("columns");
      if (!columns) return;

      const columnIndex = columns
        .toArray()
        .findIndex((col: any) => col.get("id") === columnId);
      if (columnIndex === -1) return;

      const column = columns.get(columnIndex);
      if (!column) return;

      const cards = column.get("cards") as LiveList<LiveObject<Card>>;
      if (!cards) return;

      const cardIndex = cards
        .toArray()
        .findIndex((c: any) => c.get("id") === cardId);
      if (cardIndex !== -1) {
        cards.delete(cardIndex);
      }
    },
    []
  );

  // Initialize on mount
  useEffect(() => {
    initializeColumns();
  }, [initializeColumns]);

  const handleDragStart = (card: Card, fromColumnId: string) => {
    setDraggedCard({ card, fromColumnId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (toColumnId: string) => {
    if (!draggedCard) return;

    if (draggedCard.fromColumnId !== toColumnId) {
      moveCard(draggedCard.fromColumnId, toColumnId, draggedCard.card);
    }

    setDraggedCard(null);
  };

  const handleAddCard = (columnId: string) => {
    if (!newCardTitle.trim()) return;

    addCard(columnId, newCardTitle.trim());
    setNewCardTitle("");
    setNewCardColumnId(null);
  };

  const handleEditCard = (columnId: string, cardId: string) => {
    const column = columns
      ?.toArray()
      .find((col: any) => col.get("id") === columnId);
    if (!column) return;

    const cards = column.get("cards") as LiveList<LiveObject<Card>>;
    const card = cards
      .toArray()
      .find((c: any) => c.get("id") === cardId) as LiveObject<Card>;

    if (card) {
      setEditingCard({ columnId, cardId });
      setEditCardTitle(card.get("title"));
      setEditCardDescription(card.get("description") || "");
    }
  };

  const handleSaveEdit = () => {
    if (!editingCard) return;

    updateCard(editingCard.columnId, editingCard.cardId, {
      title: editCardTitle,
      description: editCardDescription,
    });

    setEditingCard(null);
    setEditCardTitle("");
    setEditCardDescription("");
  };

  if (!columns || columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Initializing board...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-x-auto overflow-y-hidden bg-background">
      <div className="flex gap-6 h-full p-6 min-w-max">
        {columns.toArray().map((column: any, index: number) => {
          const columnId = column.get("id");
          const columnTitle = column.get("title");
          const cards = column.get("cards") as LiveList<LiveObject<Card>>;
          const cardArray = cards ? cards.toArray() : [];

          return (
            <motion.div
              key={columnId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col w-80 bg-muted rounded-xl border border-border"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(columnId)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  {columnTitle}
                  <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                    {cardArray.length}
                  </span>
                </h3>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cardArray.map((cardObj: LiveObject<Card>) => {
                  const card: Card = {
                    id: cardObj.get("id"),
                    title: cardObj.get("title"),
                    description: cardObj.get("description"),
                    createdAt: cardObj.get("createdAt"),
                  };

                  return (
                    <motion.div
                      key={card.id}
                      draggable
                      onDragStart={() => handleDragStart(card, columnId)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group bg-background border border-border rounded-lg p-3 cursor-move hover:border-pink-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-foreground">
                              {card.title}
                            </h4>
                            {card.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {card.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCard(columnId, card.id);
                            }}
                            className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Add Card Input */}
                {newCardColumnId === columnId ? (
                  <div className="bg-background border border-border rounded-lg p-3">
                    <input
                      type="text"
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddCard(columnId);
                        } else if (e.key === "Escape") {
                          setNewCardColumnId(null);
                          setNewCardTitle("");
                        }
                      }}
                      placeholder="Enter card title..."
                      className="w-full px-2 py-1 bg-transparent text-sm outline-none text-foreground"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleAddCard(columnId)}
                        className="px-3 py-1.5 bg-pink-500 text-white text-sm rounded hover:bg-pink-600 transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setNewCardColumnId(null);
                          setNewCardTitle("");
                        }}
                        className="px-3 py-1.5 text-muted-foreground text-sm rounded hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setNewCardColumnId(columnId)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-background border border-dashed border-border rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add Card
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Edit Card Modal */}
      <AnimatePresence>
        {editingCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingCard(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-background-secondary rounded-2xl shadow-2xl p-6 mx-4 border border-border"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Edit Card
                </h3>
                <button
                  onClick={() => setEditingCard(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editCardTitle}
                    onChange={(e) => setEditCardTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={editCardDescription}
                    onChange={(e) => setEditCardDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-foreground resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() =>
                      deleteCard(editingCard.columnId, editingCard.cardId)
                    }
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-colors font-medium flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => setEditingCard(null)}
                    className="px-4 py-2 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl hover:from-pink-400 hover:to-rose-500 transition-all font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
