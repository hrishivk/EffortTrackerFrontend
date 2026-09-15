import logoMark from "../assets/img/logo2.png.png";

interface RxSpinnerProps {
  size?: number;
  color?: string;
  label?: string;
  fullscreen?: boolean;
}

export default function RxSpinner({
  size = 72,
  color = "#7c3aed",
  label,
  fullscreen = true,
}: RxSpinnerProps) {
  const spinner = (
    <span
      className="rxs"
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
    >
      <span className="rxs__dial" style={{ width: size, height: size }}>
        {/* Two halos leaving at staggered times, so the pulse never stops. */}
        <span className="rxs__halo" style={{ borderColor: color }} />
        <span className="rxs__halo rxs__halo--late" style={{ borderColor: color }} />

        <svg className="rxs__ring" viewBox="0 0 100 100" aria-hidden>
          <circle className="rxs__track" cx="50" cy="50" r="44" />
          <circle
            className="rxs__arc"
            cx="50"
            cy="50"
            r="44"
            style={{ stroke: color }}
          />
        </svg>

        <span className="rxs__markWrap">
          <img className="rxs__mark" src={logoMark} alt="" draggable={false} />
          {/* The sheen that travels across the mark, clipped to it. */}
          <span className="rxs__sheen" aria-hidden />
        </span>
      </span>

      {label && <span className="rxs__label">{label}</span>}
    </span>
  );

  if (!fullscreen) return spinner;

  return <div className="rxs-overlay">{spinner}</div>;
}
