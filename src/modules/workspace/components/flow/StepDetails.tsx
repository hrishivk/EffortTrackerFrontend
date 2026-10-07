import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import TagIcon from "@mui/icons-material/Tag";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

import { initials } from "../../data/workspaceHelpers";
import PickList, { PickLabel } from "../common/PickList";
import { MAX, STATUSES, VISIBILITY, labelOf, menuProps, selectSx } from "./constants";
import { Fact, SectionHead } from "./FlowParts";
import type { WorkspaceFlowState } from "./useWorkspaceFlow";

export default function StepDetails({ f }: { f: WorkspaceFlowState }) {
  const {
    wsName, setWsName, wsCode, setWsCode, wsNote, setWsNote,
    wsStatus, setWsStatus, wsVisibility, setWsVisibility,
    isPrivate, codeMissing, creator, details, filled, completeness,
    canPickManagers, amOptions, loadingAms, managerIds, toggleManager,
  } = f;

  return (
    <>
      <SectionHead
        title="Workspace Details"
        caption="Give the workspace a name your team will recognise."
      />
      <div className="cws__split">
        <div className="cws__form">
          <p className="cws__label">
            Workspace name<span className="cws__req">*</span>
          </p>
          <input
            autoFocus
            className="cws__input"
            maxLength={MAX.name}
            value={wsName}
            onChange={(e) => setWsName(e.target.value)}
            placeholder="e.g. Product Delivery"
          />

          <div className="cws__grid">
            <div>
              <p className="cws__label">
                Workspace code
                {isPrivate && <span className="cws__req">*</span>}
              </p>
              <input
                className="cws__input"
                maxLength={MAX.code}
                value={wsCode}
                onChange={(e) => setWsCode(e.target.value.toUpperCase())}
                placeholder="e.g. PD-2026"
              />
              {isPrivate && (
                <p className={`cws__note${codeMissing ? " cws__note--warn" : ""}`}>
                  {codeMissing
                    ? "A private workspace needs a code — its members sign in with it."
                    : "Members sign in to this workspace with this code."}
                </p>
              )}
            </div>
            <div>
              <p className="cws__label">Access</p>
              <div className="cws__chips" role="radiogroup" aria-label="Access">
                {VISIBILITY.map(({ value, label, icon: Icon }) => {
                  const on = wsVisibility === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      className={`cws__chip${on ? " cws__chip--on" : ""}`}
                      onClick={() => setWsVisibility(value)}
                    >
                      <Icon sx={{ fontSize: 15 }} />
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="cws__note">
                {VISIBILITY.find((v) => v.value === wsVisibility)?.caption}
              </p>
            </div>
            <div>
              <p className="cws__label">Creator</p>
              <input
                readOnly
                className="cws__input cws__input--locked"
                value={creator}
                placeholder="Signed-in user"
              />
            </div>
            <div>
              <p className="cws__label">Status</p>
              <FormControl fullWidth size="small" sx={selectSx}>
                <Select
                  value={wsStatus}
                  onChange={(e) => setWsStatus(e.target.value)}
                  MenuProps={menuProps}
                >
                  {STATUSES.map((x) => (
                    <MenuItem key={x.value} value={x.value}>
                      {x.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </div>

          <p className="cws__label">Description (optional)</p>
          <textarea
            className="cws__textarea"
            maxLength={MAX.description}
            value={wsNote}
            onChange={(e) => setWsNote(e.target.value)}
            placeholder="What does this workspace cover?"
          />

          {canPickManagers && (
            <>
              <PickLabel
                style={{ marginTop: 16 }}
                label="Assign account managers (optional)"
                count={managerIds.length ? `· ${managerIds.length} selected` : ""}
              />
              <PickList
                loading={loadingAms}
                loadingText="Loading account managers…"
                emptyText="No other account managers."
                items={amOptions.map((m) => ({
                  id: m.id,
                  name: m.name,
                  sub: m.email ?? "Account Manager",
                }))}
                selected={managerIds}
                onToggle={toggleManager}
              />
              <p className="cws__note">
                They can open and manage this workspace with you. You can
                change this later from the workspace page.
              </p>
            </>
          )}
        </div>

        <aside className="cws__side">
          <div className="cws__side-card">
            <div className="cws__side-banner">
              <span className="cws__side-badge">{initials(wsName) || "W"}</span>
              <span className="cws__side-ident">
                <span className="cws__side-name">
                  {wsName.trim() || "Untitled workspace"}
                </span>
                <span className="cws__side-caption">{wsCode || "No code yet"}</span>
              </span>
              <span className="cws__side-chip">{labelOf(STATUSES, wsStatus)}</span>
            </div>

            <dl className="cws__facts">
              <Fact icon={TagIcon} label="Code" value={wsCode} />
              <Fact
                icon={isPrivate ? LockOutlinedIcon : PublicOutlinedIcon}
                label="Access"
                value={labelOf(VISIBILITY, wsVisibility)}
              />
              <Fact icon={PersonOutlineIcon} label="Creator" value={creator} />
            </dl>

            <div className="cws__meter">
              <span className="cws__meter-top">
                <span className="cws__meter-label">Details filled</span>
                <span className="cws__meter-count">
                  {filled}/{details.length}
                </span>
              </span>
              <span className="cws__meter-track">
                <span className="cws__meter-fill" style={{ width: `${completeness}%` }} />
              </span>
            </div>
          </div>

          <div className="cws__side-next">
            <p className="cws__side-next-title">What happens next</p>
            <ol className="cws__side-steps">
              <li>Pick the project this workspace covers.</li>
              <li>Create the rooms (teams) inside it.</li>
              <li>Assign people to each room.</li>
            </ol>
          </div>
        </aside>
      </div>
    </>
  );
}
