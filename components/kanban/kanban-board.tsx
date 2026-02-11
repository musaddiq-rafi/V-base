"use client";

import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Plus,
  Trash2,
  Edit3,
  X,
  Save,
  GripVertical,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useDroppable } from "@dnd-kit/core";

type KanbanCard = {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
};

type KanbanColumn = {
  id: string;
  title: string;
  cardIds: string[];
};

type KanbanContentV1 = {
  version: 1;
  columns: KanbanColumn[];
  cards: Record<string, KanbanCard>;
};

type KanbanBoardProps = {
  kanbanId: Id<"kanbans">;
  content?: string | null;
};

const defaultContent = (): KanbanContentV1 => ({
  version: 1,
  columns: [
    { id: "todo", title: "To do", cardIds: [] },
    { id: "in-progress", title: "In progress", cardIds: [] },
    { id: "done", title: "Done", cardIds: [] },
  ],
  cards: {},
});

const parseContent = (content?: string | null): KanbanContentV1 => {
  if (!content) return defaultContent();
  try {
    const parsed = JSON.parse(content) as KanbanContentV1;
    if (
      parsed &&
      parsed.version === 1 &&
      Array.isArray(parsed.columns) &&
      typeof parsed.cards === "object"
    ) {
      return parsed;
    }
  } catch {
    return defaultContent();
  }
  return defaultContent();
};

const cardDndId = (id: string) => `card:${id}`;
const columnDndId = (id: string) => `column:${id}`;
const isCardId = (id: string) => id.startsWith("card:");
const isColumnId = (id: string) => id.startsWith("column:");
const toCardId = (id: string) => id.replace("card:", "");
const toColumnId = (id: string) => id.replace("column:", "");

export function KanbanBoard({ kanbanId, content }: KanbanBoardProps) {
  const { user } = useUser();
  const saveKanbanContent = useMutation(api.kanban.saveKanbanContent);
  const kanbanQuery = useQuery(api.kanban.getKanbanById, { kanbanId });

  const sourceContent = content ?? kanbanQuery?.content;

  const [board, setBoard] = useState<KanbanContentV1>(() =>
    parseContent(sourceContent),
  );
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newCardTitleByColumn, setNewCardTitleByColumn] = useState<
    Record<string, string>
  >({});

  const lastSyncedRef = useRef<string>(JSON.stringify(parseContent(content)));

  useEffect(() => {
    const parsed = parseContent(sourceContent);
    setBoard(parsed);
    lastSyncedRef.current = JSON.stringify(parsed);
  }, [sourceContent]);

  useEffect(() => {
    if (!kanbanId || !user?.id) return;
    const serialized = JSON.stringify(board);
    if (serialized === lastSyncedRef.current) return;

    const handle = setTimeout(() => {
      saveKanbanContent({
        kanbanId,
        content: serialized,
        userId: user.id,
      }).catch((error) => {
        console.error("Failed to save kanban content:", error);
      });
      lastSyncedRef.current = serialized;
    }, 600);

    return () => clearTimeout(handle);
  }, [board, kanbanId, saveKanbanContent, user?.id]);

  const columnByCardId = useMemo(() => {
    const map = new Map<string, string>();
    for (const column of board.columns) {
      for (const cardId of column.cardIds) {
        map.set(cardId, column.id);
      }
    }
    return map;
  }, [board.columns]);

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    if (isCardId(id)) {
      setActiveCardId(toCardId(id));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (!isCardId(activeId)) return;

    const movingCardId = toCardId(activeId);
    const sourceColumnId = columnByCardId.get(movingCardId);
    if (!sourceColumnId) return;

    let targetColumnId = sourceColumnId;
    let targetCardId: string | null = null;

    if (isCardId(overId)) {
      targetCardId = toCardId(overId);
      targetColumnId = columnByCardId.get(targetCardId) || sourceColumnId;
    } else if (isColumnId(overId)) {
      targetColumnId = toColumnId(overId);
    }

    if (!targetColumnId) return;

    setBoard((prev) => {
      const columns = prev.columns.map((col) => ({ ...col }));
      const sourceColumn = columns.find((col) => col.id === sourceColumnId);
      const targetColumn = columns.find((col) => col.id === targetColumnId);
      if (!sourceColumn || !targetColumn) return prev;

      if (sourceColumnId === targetColumnId && targetCardId) {
        const oldIndex = sourceColumn.cardIds.indexOf(movingCardId);
        const newIndex = sourceColumn.cardIds.indexOf(targetCardId);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          sourceColumn.cardIds = arrayMove(
            sourceColumn.cardIds,
            oldIndex,
            newIndex,
          );
        }
        return { ...prev, columns };
      }

      sourceColumn.cardIds = sourceColumn.cardIds.filter(
        (id) => id !== movingCardId,
      );

      if (targetCardId) {
        const insertIndex = targetColumn.cardIds.indexOf(targetCardId);
        if (insertIndex === -1) {
          targetColumn.cardIds.push(movingCardId);
        } else {
          targetColumn.cardIds.splice(insertIndex, 0, movingCardId);
        }
      } else {
        targetColumn.cardIds.push(movingCardId);
      }

      return { ...prev, columns };
    });
  };

  const handleAddColumn = () => {
    const title = newColumnTitle.trim();
    if (!title) return;
    const id = `col-${Date.now()}`;
    setBoard((prev) => ({
      ...prev,
      columns: [...prev.columns, { id, title, cardIds: [] }],
    }));
    setNewColumnTitle("");
  };

  const handleRenameColumn = (columnId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) =>
        col.id === columnId ? { ...col, title: trimmed } : col,
      ),
    }));
  };

  const handleDeleteColumn = (columnId: string) => {
    if (!confirm("Delete this column and its cards?")) return;
    setBoard((prev) => {
      const remainingColumns = prev.columns.filter((c) => c.id !== columnId);
      const removedColumn = prev.columns.find((c) => c.id === columnId);
      const cards = { ...prev.cards };
      if (removedColumn) {
        for (const id of removedColumn.cardIds) {
          delete cards[id];
        }
      }
      return { ...prev, columns: remainingColumns, cards };
    });
  };

  const handleAddCard = (columnId: string) => {
    const title = (newCardTitleByColumn[columnId] || "").trim();
    if (!title) return;
    const id = `card-${Date.now()}`;
    const now = Date.now();
    setBoard((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [id]: {
          id,
          title,
          createdAt: now,
          updatedAt: now,
        },
      },
      columns: prev.columns.map((col) =>
        col.id === columnId
          ? { ...col, cardIds: [...col.cardIds, id] }
          : col,
      ),
    }));
    setNewCardTitleByColumn((prev) => ({ ...prev, [columnId]: "" }));
  };

  const handleDeleteCard = (cardId: string) => {
    if (!confirm("Delete this card?")) return;
    setBoard((prev) => {
      const cards = { ...prev.cards };
      delete cards[cardId];
      const columns = prev.columns.map((col) => ({
        ...col,
        cardIds: col.cardIds.filter((id) => id !== cardId),
      }));
      return { ...prev, cards, columns };
    });
  };

  const openEditCard = (cardId: string) => {
    const card = board.cards[cardId];
    if (!card) return;
    setEditingCardId(cardId);
    setEditingTitle(card.title);
    setEditingDescription(card.description || "");
  };

  const saveEditCard = () => {
    if (!editingCardId) return;
    const title = editingTitle.trim();
    if (!title) return;
    setBoard((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [editingCardId]: {
          ...prev.cards[editingCardId],
          title,
          description: editingDescription.trim() || undefined,
          updatedAt: Date.now(),
        },
      },
    }));
    setEditingCardId(null);
    setEditingTitle("");
    setEditingDescription("");
  };

  const [isListView, setIsListView] = useState(false);

  const toggleView = () => {
    setIsListView((prev) => !prev);
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0f1a]">
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 p-6 min-h-full">
            {board.columns.map((column) => (
              <KanbanColumnView
                key={column.id}
                column={column}
                cards={column.cardIds.map((id) => board.cards[id]).filter(Boolean)}
                onRename={handleRenameColumn}
                onDelete={handleDeleteColumn}
                onAddCard={handleAddCard}
                onEditCard={openEditCard}
                onDeleteCard={handleDeleteCard}
                newCardTitle={newCardTitleByColumn[column.id] || ""}
                setNewCardTitle={(value) =>
                  setNewCardTitleByColumn((prev) => ({
                    ...prev,
                    [column.id]: value,
                  }))
                }
              />
            ))}

            <div className="w-72 flex-shrink-0">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-sm text-white/60 mb-2">New column</div>
                <input
                  type="text"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  placeholder="Column title"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddColumn}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Column
                </button>
              </div>
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeCardId ? (
            <div className="bg-[#151b28] border border-white/10 rounded-lg p-3 w-64 shadow-xl">
              <div className="text-sm text-white font-medium">
                {board.cards[activeCardId]?.title || "Card"}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {editingCardId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0f1520] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Edit card</h3>
              <button
                onClick={() => setEditingCardId(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Title
                </label>
                <input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Description
                </label>
                <textarea
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingCardId(null)}
                className="flex-1 px-4 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEditCard}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        onClick={toggleView}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
      >
        {isListView ? "Kanban Board" : "List View"}
      </button>
    </div>
  );
}

function KanbanColumnView({
  column,
  cards,
  onRename,
  onDelete,
  onAddCard,
  onEditCard,
  onDeleteCard,
  newCardTitle,
  setNewCardTitle,
}: {
  column: KanbanColumn;
  cards: KanbanCard[];
  onRename: (columnId: string, title: string) => void;
  onDelete: (columnId: string) => void;
  onAddCard: (columnId: string) => void;
  onEditCard: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
  newCardTitle: string;
  setNewCardTitle: (value: string) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: columnDndId(column.id),
    data: { type: "column", columnId: column.id },
  });

  return (
    <div ref={setNodeRef} className="w-72 flex-shrink-0">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <input
            defaultValue={column.title}
            onBlur={(e) => onRename(column.id, e.target.value)}
            className="bg-transparent text-white font-semibold text-sm w-full focus:outline-none"
          />
          <button
            onClick={() => onDelete(column.id)}
            className="text-white/30 hover:text-red-400 transition-colors"
            title="Delete column"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <SortableContext
          items={cards.map((card) => cardDndId(card.id))}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3 min-h-[16px]">
            {cards.map((card) => (
              <KanbanCardItem
                key={card.id}
                card={card}
                onEdit={() => onEditCard(card.id)}
                onDelete={() => onDeleteCard(card.id)}
              />
            ))}
          </div>
        </SortableContext>

        <div className="mt-4">
          <input
            type="text"
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            placeholder="Add a card"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <button
            onClick={() => onAddCard(column.id)}
            className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Card
          </button>
        </div>
      </div>
    </div>
  );
}

function KanbanCardItem({
  card,
  onEdit,
  onDelete,
}: {
  card: KanbanCard;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: cardDndId(card.id),
      data: { type: "card", cardId: card.id },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[#151b28] border border-white/10 rounded-lg p-3 text-sm text-white shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium">{card.title}</div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="text-white/40 hover:text-white transition-colors"
            title="Edit card"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="text-white/40 hover:text-red-400 transition-colors"
            title="Delete card"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <span
            className="text-white/30 cursor-grab"
            {...attributes}
            {...listeners}
            title="Drag"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
      {card.description && (
        <p className="text-xs text-white/60 mt-2">{card.description}</p>
      )}
    </div>
  );
}
