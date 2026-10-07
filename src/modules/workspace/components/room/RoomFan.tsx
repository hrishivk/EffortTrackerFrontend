import type { DragEvent } from "react";
import { initials } from "../../data/workspaceHelpers";
import { FAN_MAX, buildFan } from "./roomLayout";
import type { RoomFanProps } from "../../types";

export default function RoomFan({
  candidates,
  busy,
  drag,
  onDragStart,
  onDragEnd,
}: RoomFanProps) {
  const fan = buildFan(candidates);

  return (
    <>
      <span className="rmo__fan-arc" />
      {fan.map(({ person, left, top }, i) => (
        <div
          key={person.id}
          draggable={!busy}
          style={{
            left: `${left}%`,
            top: `${top}%`,
            animationDelay: `${i * 45}ms`,
          }}
          onDragStart={(e: DragEvent<HTMLDivElement>) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", person.id);
            onDragStart(person.id);
          }}
          onDragEnd={onDragEnd}
          className={`rmo__fan-node${
            drag === person.id ? " rmo__fan-node--dragging" : ""
          }`}
          title={`${person.name} — ${person.role}${
            person.currentRooms.length
              ? ` · also in ${person.currentRooms.join(", ")}`
              : ""
          }`}
        >
          <span className="rmo__fan-avatar">
            {initials(person.name)}
            {person.currentRooms.length > 0 && (
              <span
                className="rmo__fan-moved"
                title={`Also in ${person.currentRooms.join(", ")}`}
              />
            )}
          </span>
          <span className="rmo__fan-name">{person.name}</span>
        </div>
      ))}
      {candidates.length > FAN_MAX && (
        <span className="rmo__fan-more">
          +{candidates.length - FAN_MAX} more
        </span>
      )}
    </>
  );
}
