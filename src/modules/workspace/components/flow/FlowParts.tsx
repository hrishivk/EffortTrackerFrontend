import type { ElementType } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import CheckIcon from "@mui/icons-material/Check";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import WorkspacesOutlinedIcon from "@mui/icons-material/WorkspacesOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";

import { STEPS } from "./constants";
import type { WorkspaceFlowState } from "./useWorkspaceFlow";

export function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className={`cws__fact${value ? "" : " cws__fact--empty"}`}>
      <span className="cws__fact-icon">
        <Icon sx={{ fontSize: 15 }} />
      </span>
      <dt className="cws__fact-label">{label}</dt>
      <dd className="cws__fact-value">{value || "Not set"}</dd>
    </div>
  );
}

export function SectionHead({ title, caption }: { title: string; caption: string }) {
  return (
    <div className="cws__section-head">
      <h2 className="cws__section-title">{title}</h2>
      <p className="cws__section-caption">{caption}</p>
    </div>
  );
}

export function FlowDone({ f }: { f: WorkspaceFlowState }) {
  const { wsName, chosenProjects, rooms, assigned, restart, leave } = f;
  return (
    <div className="cws">
      <div className="cws__finished">
        <CheckCircleIcon sx={{ fontSize: 52, color: "#16a34a" }} />
        <h2 className="cws__finished-title">{wsName} is ready</h2>
        <p className="cws__finished-caption">
          {chosenProjects.length} project{chosenProjects.length === 1 ? "" : "s"},{" "}
          {rooms.length} room{rooms.length === 1 ? "" : "s"} and {assigned.size} member
          {assigned.size === 1 ? "" : "s"} created.
        </p>
        <div className="cws__finished-actions">
          <button type="button" className="cws__ghost" onClick={restart}>
            Create another
          </button>
          <button type="button" className="cws__primary" onClick={leave}>
            Done <ArrowForwardRoundedIcon sx={{ fontSize: 17 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function FlowHeader({ f }: { f: WorkspaceFlowState }) {
  const { step, setStep, leave } = f;
  return (
    <>
      <div className="cws__head">
        <span className="cws__tile cws__tile--brand">
          <WorkspacesOutlinedIcon sx={{ fontSize: 21 }} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 className="cws__title">Create Workspace</h1>
          <p className="cws__caption">
            Set up your workspace in a few simple steps and get your team organized.
          </p>
        </div>
        <button type="button" className="cws__x" onClick={leave} title="Close">
          <CloseIcon sx={{ fontSize: 18 }} />
        </button>
      </div>

      <ol className="cws__steps">
        {STEPS.map((s, i) => {
          const state = i === step ? "on" : i < step ? "past" : "next";
          return (
            <li key={s.label} className={`cws__step cws__step--${state}`}>
              <button
                type="button"
                className="cws__step-btn"
                disabled={i > step}
                onClick={() => setStep(i)}
              >
                <span className="cws__step-dot">
                  {i < step ? <CheckIcon sx={{ fontSize: 16 }} /> : i + 1}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="cws__step-label">{s.label}</span>
                  <span className="cws__step-caption">{s.caption}</span>
                </span>
              </button>
              {i < STEPS.length - 1 && <span className="cws__step-link" />}
            </li>
          );
        })}
      </ol>
    </>
  );
}

export function FlowFooter({ f }: { f: WorkspaceFlowState }) {
  const { step, setStep, ready, saving, finish } = f;
  return (
    <div className="cws__foot">
      {step > 0 ? (
        <button type="button" className="cws__ghost" onClick={() => setStep(step - 1)}>
          <ArrowBackRoundedIcon sx={{ fontSize: 17 }} /> Back
        </button>
      ) : (
        <span />
      )}

      <div className="cws__progress">
        <span className="cws__progress-label">
          Step {step + 1} of {STEPS.length}
        </span>
        <span className="cws__progress-bar">
          {STEPS.map((s, i) => (
            <span
              key={s.label}
              className={`cws__progress-seg${i <= step ? " cws__progress-seg--on" : ""}`}
            />
          ))}
        </span>
      </div>

      <div className="cws__foot-right">
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="cws__primary"
            disabled={!ready[step]}
            onClick={() => setStep(step + 1)}
          >
            Continue <ArrowForwardRoundedIcon sx={{ fontSize: 17 }} />
          </button>
        ) : (
          <button
            type="button"
            className="cws__primary"
            disabled={saving}
            onClick={() => void finish()}
          >
            {saving ? (
              <CircularProgress size={15} sx={{ color: "#fff" }} />
            ) : (
              <RocketLaunchOutlinedIcon sx={{ fontSize: 17 }} />
            )}
            Create Workspace
          </button>
        )}
      </div>
    </div>
  );
}
