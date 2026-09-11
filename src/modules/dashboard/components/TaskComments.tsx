import { useEffect, useRef, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

import type { TaskComment } from "../../user/types";
import { parseServerTime } from "../../../shared/utils/serverTime";

/** The API truncates past this rather than rejecting; say so before it happens. */
const BODY_MAX = 2000;

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const when = (value: string) => {
  const d = new Date(parseServerTime(value));
  if (Number.isNaN(d.getTime())) return "";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
};

/**
 * Who wrote it. `user` is resolved live by the API so a rename shows through;
 * it is null for a deleted account, and `user_name` is the snapshot taken when
 * the comment was written — which is the whole reason both fields exist.
 */
const authorName = (c: TaskComment) =>
  c.user?.fullName || c.user_name || "Former member";

interface TaskCommentsProps {
  /** The task or subtask the thread belongs to. Both are rows in `tasks`. */
  taskId: string;
  comments?: TaskComment[];
  /** The API's true total. Larger than `comments.length` means older ones exist. */
  commentCount?: number;
  currentUserId?: string | number | null;
  /** The task's creator, who may delete anyone's comment on it. */
  taskCreatedBy?: string | number | null;
  /** Each resolves once the API has saved; the caller reloads afterwards. */
  onAdd: (taskId: string, body: string) => Promise<void>;
  onEdit: (taskId: string, commentId: string, body: string) => Promise<void>;
  onDelete: (taskId: string, commentId: string) => Promise<void>;
  /** Read-only when the viewer cannot act on this task at all. */
  disabled?: boolean;
  /** Tighter rows, for the subtask thread nested inside the panel. */
  dense?: boolean;
}

export default function TaskComments({
  taskId,
  comments = [],
  commentCount,
  currentUserId,
  taskCreatedBy,
  onAdd,
  onEdit,
  onDelete,
  disabled = false,
  dense = false,
}: TaskCommentsProps) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  /** The comment being edited, and the text as it is being retyped. */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  // A new thread is a new conversation — never carry a half-typed comment from
  // the last task into it.
  useEffect(() => {
    setDraft("");
    setEditingId(null);
    setEditDraft("");
  }, [taskId]);

  const mine = (c: TaskComment) => String(c.user_id) === String(currentUserId);
  // Explicit null checks: two missing ids must not compare equal and hand
  // every viewer the task creator's delete rights.
  const ownsTask =
    taskCreatedBy != null &&
    currentUserId != null &&
    String(taskCreatedBy) === String(currentUserId);

  const submit = async () => {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      await onAdd(taskId, body);
      setDraft("");
      // The new comment lands at the bottom, so follow it there.
      requestAnimationFrame(() => {
        if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
      });
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (commentId: string) => {
    const body = editDraft.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      await onEdit(taskId, commentId, body);
      setEditingId(null);
      setEditDraft("");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (commentId: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await onDelete(taskId, commentId);
    } finally {
      setBusy(false);
    }
  };

  const older = (commentCount ?? comments.length) - comments.length;

  return (
    <div className="tcm">
      {older > 0 && (
        <p className="tcm__older">
          {older} older comment{older === 1 ? "" : "s"} not shown
        </p>
      )}

      <div
        ref={boxRef}
        className={`tcm__list${dense ? " tcm__list--dense" : ""}`}
      >
        {comments.length === 0 ? (
          <p className="tcm__empty">
            No comments yet. {disabled ? "" : "Start the conversation below."}
          </p>
        ) : (
          comments.map((c) => {
            const name = authorName(c);
            const editing = editingId === c.id;
            // The author may edit; the author or the task's creator may delete.
            const canEdit = !disabled && mine(c);
            const canDelete = !disabled && (mine(c) || ownsTask);

            return (
              <div key={c.id} className="tcm__row">
                <span className="tcm__avatar" title={name}>
                  {initials(name)}
                </span>

                <div className="tcm__body">
                  <div className="tcm__meta">
                    <span className="tcm__name">{name}</span>
                    <span className="tcm__when">{when(c.created_at)}</span>
                    {c.updated_at && <span className="tcm__edited">edited</span>}

                    {(canEdit || canDelete) && !editing && (
                      <span className="tcm__actions">
                        {canEdit && (
                          <button
                            type="button"
                            title="Edit this comment"
                            onClick={() => {
                              setEditingId(c.id);
                              setEditDraft(c.body);
                            }}
                          >
                            <EditOutlinedIcon sx={{ fontSize: 13 }} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            title="Delete this comment"
                            onClick={() => void remove(c.id)}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                          </button>
                        )}
                      </span>
                    )}
                  </div>

                  {editing ? (
                    <div className="tcm__edit">
                      <textarea
                        autoFocus
                        rows={2}
                        maxLength={BODY_MAX}
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setEditingId(null);
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void saveEdit(c.id);
                          }
                        }}
                      />
                      <div className="tcm__edit-actions">
                        <button
                          type="button"
                          title="Cancel"
                          onClick={() => setEditingId(null)}
                        >
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </button>
                        <button
                          type="button"
                          title="Save"
                          disabled={!editDraft.trim() || busy}
                          onClick={() => void saveEdit(c.id)}
                        >
                          <CheckRoundedIcon sx={{ fontSize: 14 }} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="tcm__text">{c.body}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {!disabled && (
        <div className="tcm__compose">
          <textarea
            rows={dense ? 1 : 2}
            maxLength={BODY_MAX}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter breaks the line — a comment is usually
              // one line, and reaching for the button every time is friction.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder="Write a comment…"
          />
          <button
            type="button"
            className="tcm__send"
            title="Post comment (Enter)"
            disabled={!draft.trim() || busy}
            onClick={() => void submit()}
          >
            {busy ? (
              <CircularProgress size={13} sx={{ color: "inherit" }} />
            ) : (
              <SendRoundedIcon sx={{ fontSize: 15 }} />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
