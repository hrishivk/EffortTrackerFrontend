import type { ComponentProps, ReactNode } from "react";
import { FormControl, MenuItem, Select } from "@mui/material";
import { motion } from "framer-motion";
import { FiFolder, FiSliders, FiUsers } from "react-icons/fi";
import MentionPicker from "../../../../shared/components/User/MentionPicker";
import { SCOPES, TAB_SPRING, inputSx, valueSx, type Group, type Proj, type Scope } from "./constants";
import DateRangeField from "./DateRangeField";
import type { ReportPeople } from "./useReportPeople";

type SelectedPerson = { id: string; name: string; role?: string } | null;

type Props = {
  canSeeOthers: boolean;
  scope: Scope;
  onScopeChange: (scope: Scope) => void;
  actions: ReactNode;
  peopleState: ReportPeople;
  memberId: string;
  selectedPerson: SelectedPerson;
  onMemberChange: (id: string, person: SelectedPerson) => void;
  dateRange: ComponentProps<typeof DateRangeField>;
  projects: Proj[];
  projectId: string;
  onProjectChange: (id: string) => void;
  groups: Group[];
  groupId: string;
  onGroupChange: (id: string) => void;
};

const ScopeTabs = ({ scope, onScopeChange }: Pick<Props, "scope" | "onScopeChange">) => (
  <div className="tr-scope" role="tablist" aria-label="Report scope">
    {SCOPES.map(({ key, label, Icon }) => {
      const active = scope === key;
      return (
        <motion.button
          key={key}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onScopeChange(key)}
          whileTap={{ scale: 0.94 }}
          transition={TAB_SPRING}
          className="tr-scope__btn"
          style={{ color: active ? "#fff" : "var(--text-muted)" }}
        >
          {active && (
            <motion.span
              layoutId="reportScopePill"
              transition={TAB_SPRING}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 8,
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                boxShadow: "0 2px 10px rgba(124, 58, 237, 0.35)",
                zIndex: 0,
              }}
            />
          )}
          <motion.span
            animate={{ scale: active ? 1.12 : 1 }}
            transition={TAB_SPRING}
            style={{ position: "relative", zIndex: 1, display: "inline-flex" }}
          >
            <Icon size={13} />
          </motion.span>
          <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
        </motion.button>
      );
    })}
  </div>
);

type OptionSelectProps = {
  value: string;
  onChange: (id: string) => void;
  options: { id: string; name: string }[];
  emptyLabel: string;
};

const OptionSelect = ({ value, onChange, options, emptyLabel }: OptionSelectProps) => (
  <FormControl fullWidth size="small" sx={inputSx}>
    <Select
      displayEmpty
      value={value}
      onChange={(e) => onChange(String(e.target.value))}
      renderValue={(v) => (v && options.find((o) => o.id === v)?.name) || emptyLabel}
      sx={valueSx(true)}
    >
      <MenuItem value="">{emptyLabel}</MenuItem>
      {options.map((o) => (
        <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
      ))}
    </Select>
  </FormControl>
);

const ReportConfig = ({
  canSeeOthers,
  scope,
  onScopeChange,
  actions,
  peopleState,
  memberId,
  selectedPerson,
  onMemberChange,
  dateRange,
  projects,
  projectId,
  onProjectChange,
  groups,
  groupId,
  onGroupChange,
}: Props) => (
  <section className="tr-card tr-config">
    <div className="tr-card__head">
      <span className="tr-card__icon"><FiSliders size={17} /></span>
      <h2 className="tr-card__title">Report Configuration</h2>

      <div className="tr-head-actions">
        {canSeeOthers && <ScopeTabs scope={scope} onScopeChange={onScopeChange} />}
        {actions}
      </div>
    </div>

    <div className="tr-config__grid">
      {scope === "user" && canSeeOthers && (
        <label className="tr-field">
          <span className="tr-field__label">
            Select team member
            <span className="tr-field__count">
              <FiUsers size={11} />
              {peopleState.people.length} loaded
            </span>
          </span>
          <MentionPicker
            people={peopleState.pickablePeople}
            value={memberId}
            onChange={(id) =>
              onMemberChange(id, peopleState.pickablePeople.find((p) => p.id === id) ?? null)
            }
            allowEmpty={false}
            placeholder="Type a name to search…"
            onOpen={peopleState.openPeople}
            onSearch={peopleState.searchPeople}
            page={peopleState.peoplePage}
            pageCount={peopleState.peoplePages}
            onPageChange={peopleState.loadPeoplePage}
            loading={peopleState.peopleLoading}
            selected={selectedPerson}
          />
        </label>
      )}

      <DateRangeField {...dateRange} />

      <label className="tr-field">
        <span className="tr-field__label">
          Project
          {projects.length > 0 && (
            <span className="tr-field__count">
              <FiFolder size={11} />
              {projects.length} assigned
            </span>
          )}
        </span>
        <OptionSelect
          value={projectId}
          onChange={onProjectChange}
          options={projects}
          emptyLabel="All Projects"
        />
      </label>

      <label className="tr-field">
        <span className="tr-field__label">Status group</span>
        <OptionSelect
          value={groupId}
          onChange={onGroupChange}
          options={groups}
          emptyLabel="All Statuses"
        />
      </label>
    </div>
  </section>
);

export default ReportConfig;
