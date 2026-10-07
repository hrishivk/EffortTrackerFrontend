import type React from "react";
import { FormControl, Select, MenuItem } from "@mui/material";
import type { formUserData } from "../../../../shared/types/User";
import { avatarColors, menuProps, selectSx } from "./constants";
import { CheckToggle, InitialsBubble } from "./FormBits";
import { avatarColorFor } from "./helpers";
import type { CreateForm } from "./types";

type Props = {
  role: string | undefined;
  viewUserId?: string;
  form: CreateForm;
  setForm: React.Dispatch<React.SetStateAction<CreateForm>>;
  assignToSelf: boolean;
  setAssignToSelf: (next: boolean) => void;
  noMembersAssigned: boolean;
  assignableUsers: formUserData[];
  users: formUserData[];
  getUserName: (id: string) => string;
  currentUserName?: string;
  onGoToProjects: () => void;
};

export default function AssigneePicker({
  role,
  viewUserId,
  form,
  setForm,
  assignToSelf,
  setAssignToSelf,
  noMembersAssigned,
  assignableUsers,
  users,
  getUserName,
  currentUserName,
  onGoToProjects,
}: Props) {
  return (
    <div className="mb-4">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="text-sm font-semibold" style={{ lineHeight: 1, color: "var(--text-secondary)" }}>
          Assignee
        </span>
        {role === "AM" && !viewUserId && (
          <CheckToggle
            checked={assignToSelf}
            label="Assign to myself"
            onToggle={() => {
              const next = !assignToSelf;
              setAssignToSelf(next);
              if (next) setForm((f) => ({ ...f, assignees: [] }));
            }}
          />
        )}
      </div>

      {assignToSelf ? (
        <div
          className="flex items-center gap-3 p-3"
          style={{
            backgroundColor: "#f5f3ff",
            border: "1px solid #e0d6ff",
            borderRadius: 12,
          }}
        >
          <InitialsBubble
            name={currentUserName || "Me"}
            size={32}
            fontSize={12}
            color="#7c3aed"
            className="flex-shrink-0"
          />
          <div>
            <p className="text-sm font-semibold" style={{ margin: 0, color: "var(--text-primary)" }}>
              {currentUserName || "Me"}
            </p>
            <p className="text-xs" style={{ margin: 0, color: "var(--text-muted)" }}>
              This task will be assigned to you
            </p>
          </div>
        </div>
      ) : noMembersAssigned ? (
        <div
          className="flex items-start gap-3 p-3"
          style={{
            backgroundColor: "#fef3c7",
            border: "1px solid #fcd34d",
            borderRadius: 12,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1.2 }}>&#9888;</span>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              No members assigned to this project
            </p>
            <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
              Please assign members to this project first before creating a task.
            </p>
            <button
              type="button"
              onClick={onGoToProjects}
              className="text-xs font-semibold"
              style={{
                color: "#7c3aed",
                textDecoration: "underline",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Go to Departments & Projects &rarr;
            </button>
          </div>
        </div>
      ) : (
        <FormControl fullWidth size="small" sx={selectSx}>
          <Select
            multiple
            value={form.assignees}
            onChange={(e) => {
              const val = e.target.value;
              setForm((f) => ({
                ...f,
                assignees: typeof val === "string" ? val.split(",") : val,
              }));
            }}
            displayEmpty
            renderValue={(selected) =>
              selected.length === 0
                ? <span style={{ color: "#9ca3af" }}>Search team members...</span>
                : <span style={{ fontSize: 13 }}>{selected.length} member{selected.length > 1 ? "s" : ""} selected</span>
            }
            MenuProps={menuProps}
          >
            {assignableUsers.map((u, i) => (
              <MenuItem key={u.id} value={String(u.id)}>
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="checkbox"
                    checked={form.assignees.includes(String(u.id))}
                    readOnly
                    style={{ accentColor: "#7c3aed", width: 14, height: 14 }}
                  />
                  <InitialsBubble
                    name={u.fullName}
                    size={24}
                    fontSize={10}
                    color={avatarColors[i % avatarColors.length]}
                  />
                  <span style={{ fontSize: 13 }}>{u.fullName}</span>
                </div>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      {form.assignees.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {form.assignees.map((id) => {
            const name = getUserName(id);
            return (
              <div
                key={id}
                className="flex items-center gap-1.5 px-2 py-1"
                style={{ backgroundColor: "var(--bg-hover)", borderRadius: 12 }}
              >
                <InitialsBubble
                  name={name}
                  size={20}
                  fontSize={8}
                  color={avatarColorFor(users, id)}
                />
                <span style={{ fontSize: 11, fontWeight: 500 }}>{name}</span>
                <button
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      assignees: f.assignees.filter((a) => a !== id),
                    }))
                  }
                  className="ml-0.5"
                  style={{ color: "var(--text-faint)", fontSize: 13, lineHeight: 1, fontWeight: 700 }}
                >
                  &times;
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
