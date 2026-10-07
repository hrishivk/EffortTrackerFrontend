import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { FiArrowDownRight, FiArrowUpRight } from "react-icons/fi";

const Delta = ({ value }: { value: number | null }) =>
  value === null ? null : (
    <span className={`tr-delta${value < 0 ? " tr-delta--down" : ""}`}>
      {value < 0 ? <FiArrowDownRight size={12} /> : <FiArrowUpRight size={12} />}
      {value > 0 ? "+" : ""}
      {value}%
    </span>
  );

type CardHeadProps = {
  Icon: IconType;
  title: string;
  note?: ReactNode;
  delta?: number | null;
};

export const CardHead = ({ Icon, title, note, delta }: CardHeadProps) => (
  <div className="tr-card__head">
    <span className="tr-card__icon"><Icon size={17} /></span>
    {note === undefined ? (
      <h3 className="tr-card__title">{title}</h3>
    ) : (
      <div className="tr-card__titles">
        <h3 className="tr-card__title">{title}</h3>
        <p className="tr-card__note">{note}</p>
      </div>
    )}
    {delta !== undefined && (
      <div className="tr-card__delta">
        <Delta value={delta} />
        <span className="tr-card__vs">vs previous period</span>
      </div>
    )}
  </div>
);

export const Tiles = ({ items }: { items: [ReactNode, string][] }) => (
  <div className="tr-tiles">
    {items.map(([value, label]) => (
      <div key={label} className="tr-tile"><b>{value}</b><span>{label}</span></div>
    ))}
  </div>
);
