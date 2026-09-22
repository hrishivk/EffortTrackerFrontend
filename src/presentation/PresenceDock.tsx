import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
import { FiUsers, FiX, FiChevronRight } from "react-icons/fi";

import { useAppSelector } from "../store/configureStore";
import { fetchAllUsers } from "../core/actions/spAction";
import type { formUserData } from "../shared/types/User";

/**
 * Who is around, in the corner of every page.
 *
 * Presence is read, not reported: `lastSeenAt` is already stamped on every user
 * and already drives the Last Active column, so this needs nothing new from the
 * API — it just asks the question the table cannot, which is "who could I reach
 * right now", and answers it from wherever you happen to be standing.
 *
 * It opens the way the notification panel does — in from the right, over a dim —
 * because it is the same kind of thing: a tray you glance at and dismiss, not a
 * place you go.
 *
 * Managers only. The roster comes from `/list-users`, which is theirs; a member
 * has their room for this, and asking would only earn them a 403.
 */

/** Seen inside this many minutes and you are on. */
const ONLINE_MINUTES = 5;
/** Beyond this, away becomes offline. */
const AWAY_MINUTES = 30;

/** How often the roster is asked again while the dock is on screen. */
const REFRESH_MS = 60_000;

type Presence = "online" | "away" | "offline";

type Person = {
  id: string;
  name: string;
  role: string;
  email: string;
  state: Presence;
  /** "now", "12m", "3h", "18 Sep" — short enough for the end of a row. */
  when: string;
};

const GROUPS: { key: Presence; label: string }[] = [
  { key: "online", label: "Online" },
  { key: "away", label: "Away" },
  { key: "offline", label: "Offline" },
];

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

/**
 * One colour per person, picked from their id rather than their position, so a
 * face keeps its colour as the roster reorders around it.
 */
const TINTS = [
  ["#7c3aed", "#a855f7"],
  ["#0ea5e9", "#38bdf8"],
  ["#f97316", "#fb923c"],
  ["#14b8a6", "#2dd4bf"],
  ["#e11d48", "#fb7185"],
  ["#6366f1", "#818cf8"],
];

const tintOf = (id: string) => {
  let n = 0;
  for (let i = 0; i < id.length; i += 1) n = (n + id.charCodeAt(i)) % TINTS.length;
  return TINTS[n];
};

/**
 * Where somebody is, from the one timestamp we have.
 *
 * `lastSeenAt` is not always a date: an account that has never signed in comes
 * back as the sentence "No login activity recorded", which the Last Active
 * column renders as-is. Anything unparseable is simply offline here, with
 * nothing claimed about when.
 */
const readPresence = (raw?: string | null): { state: Presence; when: string } => {
  const seen = raw ? dayjs(raw) : null;
  if (!seen || !seen.isValid()) return { state: "offline", when: "never" };

  const minutes = dayjs().diff(seen, "minute");
  if (minutes < ONLINE_MINUTES) return { state: "online", when: "now" };

  const when =
    minutes < 60
      ? `${minutes}m`
      : minutes < 60 * 24
        ? `${Math.floor(minutes / 60)}h`
        : seen.format("D MMM");

  return { state: minutes < AWAY_MINUTES ? "away" : "offline", when };
};

export default function PresenceDock() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);
  const role = user?.role;
  const isManager = role === "SP" || role === "AM";

  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [onlyOnline, setOnlyOnline] = useState(false);
  /** Hidden for good once the roster proves unreachable. */
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchAllUsers();
      const rows: formUserData[] = res?.data ?? [];
      setPeople(
        rows
          // Your own row is not company: you know where you are.
          .filter((u) => String(u.id) !== String(user?.id))
          .map((u) => {
            const { state, when } = readPresence(u.lastSeenAt as string | null);
            return {
              id: String(u.id),
              name: u.fullName ?? "Unknown",
              role: u.role ?? "",
              email: u.email ?? "",
              state,
              when,
            };
          })
      );
    } catch {
      // A roster this caller cannot read is a dock with nothing to show.
      setDenied(true);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isManager) return;
    void load();
    const id = window.setInterval(() => void load(), REFRESH_MS);
    // Coming back to the tab is exactly when the answer is most stale.
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [isManager, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const onlineCount = useMemo(
    () => people.filter((p) => p.state === "online").length,
    [people]
  );

  const shown = useMemo(
    () => (onlyOnline ? people.filter((p) => p.state === "online") : people),
    [people, onlyOnline]
  );

  if (!isManager || denied) return null;

  const openTasks = (p: Person) => {
    setOpen(false);
    navigate(
      `/${(role ?? "").toLowerCase()}/dashboard?viewUser=${encodeURIComponent(p.id)}` +
        `&viewUserName=${encodeURIComponent(p.name)}`
    );
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pdock__scrim"
              onClick={() => setOpen(false)}
            />

            <motion.aside
              // The notification panel's entrance, to the frame: these are the
              // same kind of thing, so they should arrive the same way.
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="pdock__panel"
              aria-label="People"
            >
              <div className="pdock__top">
                <div>
                  <p className="pdock__eyebrow">Team</p>
                  <h2 className="pdock__title">Who&rsquo;s around</h2>
                </div>
                <button
                  type="button"
                  className="pdock__icon-btn"
                  title="Close"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                >
                  <FiX size={14} />
                </button>
              </div>

              <div className="pdock__chips" role="group" aria-label="Filter">
                <button
                  type="button"
                  className={`pdock__chip${onlyOnline ? "" : " pdock__chip--on"}`}
                  onClick={() => setOnlyOnline(false)}
                >
                  Everyone <span>{people.length}</span>
                </button>
                <button
                  type="button"
                  className={`pdock__chip${onlyOnline ? " pdock__chip--on" : ""}`}
                  onClick={() => setOnlyOnline(true)}
                >
                  Online <span>{onlineCount}</span>
                </button>
              </div>

              <div className="pdock__list">
                {shown.length === 0 && (
                  <p className="pdock__empty">
                    {people.length === 0
                      ? "Reading the team…"
                      : "Nobody is online right now."}
                  </p>
                )}

                {GROUPS.map((g) => {
                  const rows = shown.filter((p) => p.state === g.key);
                  if (!rows.length) return null;
                  return (
                    <div key={g.key}>
                      <p className="pdock__group">
                        {g.label} &middot; {rows.length}
                      </p>
                      {rows.map((p) => {
                        const tint = tintOf(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            className={`pdock__person is-${p.state}`}
                            title={`${p.name} — open their tasks`}
                            onClick={() => openTasks(p)}
                          >
                            <span
                              className="pdock__avatar"
                              style={{
                                background: `linear-gradient(140deg, ${tint[0]}, ${tint[1]})`,
                              }}
                            >
                              {initialsOf(p.name)}
                              <span className="pdock__status" />
                            </span>

                            <span style={{ minWidth: 0 }}>
                              <p className="pdock__name">
                                {p.name}
                                {p.role && <span className="pdock__role">{p.role}</span>}
                              </p>
                              <p className="pdock__meta">{p.email}</p>
                            </span>

                            <span className="pdock__when">{p.when}</span>
                            <span className="pdock__go" aria-hidden="true">
                              <FiChevronRight size={13} />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <p className="pdock__foot">
                <FiUsers size={11} />
                Active in the last {ONLINE_MINUTES} minutes counts as online.
              </p>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <button
        type="button"
        className="pdock__fab"
        aria-expanded={open}
        aria-label="Who's around"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="pdock__fab-icon pdock__fab-icon--people">
          <FiUsers size={21} />
        </span>
        <span className="pdock__fab-icon pdock__fab-icon--close">
          <FiX size={20} />
        </span>

        {onlineCount > 0 && <span className="pdock__count">{onlineCount}</span>}

        <span className="pdock__tip">
          {onlineCount > 0
            ? `${onlineCount} ${onlineCount === 1 ? "person" : "people"} online`
            : "Who's around"}
        </span>
      </button>
    </>
  );
}
