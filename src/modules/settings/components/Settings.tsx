import { FiCheck, FiMoon, FiSun } from "react-icons/fi";

import { useTheme } from "../../../contexts/ThemeContext";
import BoardLanes from "./BoardLanes";


const OPTIONS = [
  {
    key: "light" as const,
    label: "Light",
    note: "Bright background, dark text. The default.",
    Icon: FiSun,
  },
  {
    key: "dark" as const,
    label: "Dark",
    note: "Dark background, light text. Easier in a dim room.",
    Icon: FiMoon,
  },
];

export default function Settings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="set-page">
      <header className="set-head">
        <h1 className="set-title">Settings</h1>
        <p className="set-sub">Manage how the tracker looks and behaves for you.</p>
      </header>

      <section className="set-card" aria-labelledby="set-appearance">
        <div className="set-card__head">
          <h2 className="set-card__title" id="set-appearance">Appearance</h2>
          <p className="set-card__note">
            Applies to this browser only, and is remembered the next time you sign in.
          </p>
        </div>

        <div className="set-themes" role="radiogroup" aria-labelledby="set-appearance">
          {OPTIONS.map(({ key, label, note, Icon }) => {
            const on = theme === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={on}
                className={`set-theme${on ? " set-theme--on" : ""}`}
                onClick={() => {
                  if (!on) toggleTheme();
                }}
              >
                <span className="set-theme__icon">
                  <Icon size={17} />
                </span>
                <span className="set-theme__text">
                  <span className="set-theme__label">{label}</span>
                  <span className="set-theme__note">{note}</span>
                </span>
                {on && (
                  <span className="set-theme__tick" aria-hidden>
                    <FiCheck size={13} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <BoardLanes />
    </div>
  );
}
