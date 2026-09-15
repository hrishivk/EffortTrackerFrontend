import { useEffect, useState } from "react";

import RxSpinner from "./RxSpinner";

/**
 * A page to look at the spinner on, at the sizes it will actually be used at.
 *
 * Here rather than in Storybook because there is no Storybook — and a spinner
 * is a thing you have to watch for a few seconds to judge, which a screenshot
 * cannot tell you. Delete the route when the loader is settled.
 */

const SIZES = [
  { size: 140, note: "Splash" },
  { size: 72, note: "Panel" },
  { size: 40, note: "Inline" },
];

export default function RxSpinnerPreview() {
  const [color, setColor] = useState("#7c3aed");
  const [onDark, setOnDark] = useState(false);
  const [overlay, setOverlay] = useState(false);

  // The overlay blocks the page, so it lets itself go rather than needing a
  // dismiss control that the real loader will never have.
  useEffect(() => {
    if (!overlay) return;
    const t = window.setTimeout(() => setOverlay(false), 5000);
    return () => window.clearTimeout(t);
  }, [overlay]);

  return (
    <div style={{ padding: "28px 4px 60px" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 20 }}>
        <button type="button" onClick={() => setOverlay(true)}>
          Show full-screen loader (5s)
        </button>
        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
          <input
            type="checkbox"
            checked={onDark}
            onChange={(e) => setOnDark(e.target.checked)}
          />
          Dark cards
        </label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          aria-label="Arc colour"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 14,
        }}
      >
        {SIZES.map((s) => (
          <div
            key={s.size}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              padding: "26px 14px 18px",
              border: "1px solid var(--border-light)",
              borderRadius: 14,
              backgroundColor: onDark ? "rgba(0, 0, 0, 0.72)" : "var(--bg-card)",
              minHeight: 190,
              justifyContent: "center",
            }}
          >
            <RxSpinner
              fullscreen={false}
              size={s.size}
              color={onDark ? "#fff" : color}
            />
            <span
              style={{
                fontSize: 10.5,
                lineHeight: 1.45,
                textAlign: "center",
                color: onDark ? "rgba(255,255,255,0.6)" : "var(--text-faint)",
              }}
            >
              {s.note}
            </span>
          </div>
        ))}
      </div>

      {overlay && <RxSpinner size={110} color="#fff" label="Loading" />}
    </div>
  );
}
