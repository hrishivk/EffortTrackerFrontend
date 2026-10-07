export default function DragHandle({ disabled, title }: { disabled?: boolean; title?: string }) {
  return (
    <span
      title={title}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 3px)",
        gap: 2,
        alignContent: "start",
        paddingTop: 3,
        flexShrink: 0,
        cursor: disabled ? "not-allowed" : "grab",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 3,
            height: 3,
            borderRadius: "50%",
            backgroundColor: "var(--text-faint)",
          }}
        />
      ))}
    </span>
  );
}
