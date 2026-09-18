import { useCallback, useEffect, useState } from "react";
import { FiCheck, FiEdit2, FiPlus, FiTrash2, FiX } from "react-icons/fi";

import Dialoge from "../../../presentation/Dialog";
import {
  createTaskGroup,
  deleteTaskGroup,
  fetchTaskGroups,
  updateTaskGroup,
} from "../../../core/actions/action";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import type { TaskGroup } from "../../dashboard/types";

/**
 * The board's columns, as a list you can edit.
 *
 * `/task-groups` has had create, rename, recolour and delete since the board
 * shipped, with no screen behind any of it — a lane could only ever be added
 * from the board itself. This is that screen.
 *
 * Reordering is by the `position` the API already takes: the arrows swap two
 * neighbours and PATCH both, rather than dragging, which would be a lot of
 * machinery for a list this short.
 */

/** The swatches a lane can take. Enough to tell lanes apart, few enough to pick from. */
const COLORS = [
  "#7c3aed",
  "#2563eb",
  "#0891b2",
  "#16a34a",
  "#ca8a04",
  "#ea580c",
  "#dc2626",
  "#db2777",
  "#64748b",
];

const NAME_MAX = 32;

export default function BoardLanes() {
  const { showSnackbar } = useSnackbar();

  const [lanes, setLanes] = useState<TaskGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // The lane being renamed, and the draft of its name.
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);

  const [confirmDelete, setConfirmDelete] = useState<TaskGroup | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTaskGroups();
      const rows: TaskGroup[] = res?.data || [];
      // The API does not promise an order, and `position` is what the board
      // draws by, so sort on it here rather than trusting the array.
      setLanes([...rows].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)));
    } catch {
      showSnackbar({ message: "Could not load the board lanes", severity: "error" });
      setLanes([]);
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    void load();
  }, [load]);

  const guard = async (run: () => Promise<unknown>, fail: string) => {
    setBusy(true);
    try {
      await run();
      await load();
      return true;
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response
        ?.data?.message;
      showSnackbar({ message: message || fail, severity: "error" });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const onAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    const ok = await guard(
      () => createTaskGroup({ name, color: newColor }),
      "Could not add the lane"
    );
    if (ok) {
      showSnackbar({ message: `"${name}" added`, severity: "success" });
      setAdding(false);
      setNewName("");
      setNewColor(COLORS[0]);
    }
  };

  const onRename = async (lane: TaskGroup) => {
    const name = draft.trim();
    if (!name || name === lane.name) {
      setEditing(null);
      return;
    }
    const ok = await guard(
      () => updateTaskGroup(lane.id, { name }),
      "Could not rename the lane"
    );
    if (ok) setEditing(null);
  };

  const onRecolour = (lane: TaskGroup, color: string) =>
    guard(() => updateTaskGroup(lane.id, { color }), "Could not change the colour");

  /**
   * Swap a lane with its neighbour.
   *
   * Both rows move, so both are PATCHed — sending only the one that was
   * clicked leaves two lanes claiming the same position and the board picks
   * between them arbitrarily.
   */
  const move = (index: number, by: -1 | 1) => {
    const other = index + by;
    if (other < 0 || other >= lanes.length) return;
    const a = lanes[index];
    const b = lanes[other];
    return guard(
      () =>
        Promise.all([
          updateTaskGroup(a.id, { position: b.position ?? other }),
          updateTaskGroup(b.id, { position: a.position ?? index }),
        ]),
      "Could not reorder the lanes"
    );
  };

  const onDelete = async () => {
    const lane = confirmDelete;
    if (!lane) return;
    const ok = await guard(() => deleteTaskGroup(lane.id), "Could not delete the lane");
    if (ok) showSnackbar({ message: `"${lane.name}" deleted`, severity: "success" });
    setConfirmDelete(null);
  };

  return (
    <section className="set-card" aria-labelledby="set-lanes">
      <div className="set-card__head">
        <h2 className="set-card__title" id="set-lanes">Board lanes</h2>
        <p className="set-card__note">
          The columns tasks are dragged between on the board. Renaming one moves every
          task in it with the name.
        </p>
      </div>

      {loading ? (
        <p className="set-lanes__empty">Loading…</p>
      ) : (
        <ul className="set-lanes">
          {lanes.length === 0 && (
            <li className="set-lanes__empty">No lanes yet — add the first one below.</li>
          )}

          {lanes.map((lane, i) => {
            const isEditing = editing === lane.id;
            return (
              <li key={lane.id} className="set-lane">
                <span className="set-lane__order">
                  <button
                    type="button"
                    onClick={() => void move(i, -1)}
                    disabled={busy || i === 0}
                    aria-label={`Move ${lane.name} up`}
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => void move(i, 1)}
                    disabled={busy || i === lanes.length - 1}
                    aria-label={`Move ${lane.name} down`}
                    title="Move down"
                  >
                    ▼
                  </button>
                </span>

                <span
                  className="set-lane__swatch"
                  style={{ backgroundColor: lane.color || COLORS[0] }}
                />

                {isEditing ? (
                  <input
                    className="set-lane__input"
                    value={draft}
                    autoFocus
                    maxLength={NAME_MAX}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void onRename(lane);
                      if (e.key === "Escape") setEditing(null);
                    }}
                  />
                ) : (
                  <span className="set-lane__name">{lane.name}</span>
                )}

                {/* The palette only appears while the row is being edited —
                    nine swatches on every row would drown the names. */}
                {isEditing && (
                  <span className="set-lane__colors">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`set-lane__color${lane.color === c ? " is-on" : ""}`}
                        style={{ backgroundColor: c }}
                        onClick={() => void onRecolour(lane, c)}
                        aria-label={`Colour ${lane.name}`}
                      />
                    ))}
                  </span>
                )}

                <span className="set-lane__actions">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void onRename(lane)}
                        disabled={busy}
                        title="Save"
                      >
                        <FiCheck size={14} />
                      </button>
                      <button type="button" onClick={() => setEditing(null)} title="Cancel">
                        <FiX size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(lane.id);
                          setDraft(lane.name);
                        }}
                        title="Rename or recolour"
                      >
                        <FiEdit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="set-lane__danger"
                        onClick={() => setConfirmDelete(lane)}
                        title="Delete"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {adding ? (
        <div className="set-lane set-lane--new">
          <span className="set-lane__swatch" style={{ backgroundColor: newColor }} />
          <input
            className="set-lane__input"
            value={newName}
            autoFocus
            maxLength={NAME_MAX}
            placeholder="Lane name"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void onAdd();
              if (e.key === "Escape") setAdding(false);
            }}
          />
          <span className="set-lane__colors">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`set-lane__color${newColor === c ? " is-on" : ""}`}
                style={{ backgroundColor: c }}
                onClick={() => setNewColor(c)}
                aria-label="Lane colour"
              />
            ))}
          </span>
          <span className="set-lane__actions">
            <button
              type="button"
              onClick={() => void onAdd()}
              disabled={busy || !newName.trim()}
              title="Add"
            >
              <FiCheck size={14} />
            </button>
            <button type="button" onClick={() => setAdding(false)} title="Cancel">
              <FiX size={14} />
            </button>
          </span>
        </div>
      ) : (
        <button
          type="button"
          className="set-lanes__add"
          onClick={() => setAdding(true)}
          disabled={loading}
        >
          <FiPlus size={14} />
          Add a lane
        </button>
      )}

      <Dialoge
        open={!!confirmDelete}
        data="removeGroup"
        busy={busy}
        title={confirmDelete ? `Delete "${confirmDelete.name}"?` : undefined}
        message="The lane is removed from the board. Tasks in it are not deleted — they keep the status they have."
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => void onDelete()}
      />
    </section>
  );
}
