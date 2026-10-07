import type { ReactNode } from "react";

const fieldSx = (
  bg: string,
  border: string,
  hoverBorder: string,
  focusBorder: string,
  focusShadow: string
) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: bg,
    fontSize: 13,
    fontWeight: 600,
    "& fieldset": { borderColor: border },
    "&:hover fieldset": { borderColor: hoverBorder },
    "&.Mui-focused fieldset": {
      borderColor: focusBorder,
      boxShadow: focusShadow,
    },
  },
  "& .MuiInputBase-input": { padding: "6px 12px", fontSize: 13, fontWeight: 600 },
  "& .MuiSelect-select": { padding: "6px 12px" },
});

export const inputSx = fieldSx(
  "var(--bg-card)",
  "var(--border-light)",
  "var(--border-light)",
  "#7c3aed",
  "0 0 0 2px rgba(124,58,237,0.12)"
);

export const errorSx = fieldSx(
  "#fef2f2",
  "#ef4444",
  "#dc2626",
  "#dc2626",
  "0 0 0 2px rgba(239,68,68,0.12)"
);

export const menuProps = {
  PaperProps: {
    sx: { borderRadius: 3, boxShadow: "0px 8px 30px rgba(0,0,0,0.08)" },
  },
};

export const gradientBtnStyle = {
  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  padding: "6px 16px",
};

export const sectionLabelStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

export const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export const ErrorText = ({ message }: { message?: string }) =>
  message ? (
    <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 500, margin: "4px 0 0" }}>{message}</p>
  ) : null;

export const RequiredMark = () => <span style={{ color: "#ef4444" }}>*</span>;

export const CheckBadge = () => (
  <div
    style={{
      width: 24,
      height: 24,
      borderRadius: "50%",
      backgroundColor: "#7c3aed",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      fontSize: 14,
    }}
  >
    &#10003;
  </div>
);

export const PlusMark = () => (
  <span style={{ color: "#7c3aed", fontSize: 20, fontWeight: 300 }}>+</span>
);

export const SectionCard = ({
  children,
  borderColor = "var(--border-light)",
}: {
  children: ReactNode;
  borderColor?: string;
}) => (
  <div
    className="rounded-3 border p-4 mb-4"
    style={{ backgroundColor: "var(--bg-card)", border: `1px solid ${borderColor}` }}
  >
    {children}
  </div>
);
