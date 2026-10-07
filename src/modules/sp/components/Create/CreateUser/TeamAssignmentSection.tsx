import GroupsIcon from "@mui/icons-material/Groups";
import type { project } from "../../../../../shared/types/Project";
import type { Domain } from "../../../../../shared/types/Domain";
import { SectionHeader } from "./formControls";
import { EmptyBox, SelectableCard, SelectionGrid } from "./SelectionGrid";
import type { UserForm } from "./createUserUtils";

type Props = {
  form: UserForm;
  isSharing: boolean;
  domainList: Domain[];
  projectList: project[];
  visibleProjects: project[];
  onToggleDomain: (id: string) => void;
  onToggleProject: (id: string) => void;
  onClearDomains: () => void;
  onClearProjects: () => void;
};

const TeamAssignmentSection = ({
  form,
  isSharing,
  domainList,
  projectList,
  visibleProjects,
  onToggleDomain,
  onToggleProject,
  onClearDomains,
  onClearProjects,
}: Props) => {
  const departmentLabel = form.departments.join(", ");

  const projectSummary =
    form.projects.length > 0
      ? `${form.projects.length} of ${visibleProjects.length} selected`
      : form.departments.length
        ? `${visibleProjects.length} project${
            visibleProjects.length === 1 ? "" : "s"
          } in ${departmentLabel}`
        : "Choose a department to see its projects";

  const domainSummary =
    form.domains.length > 0
      ? `${form.domains.length} of ${domainList.length} selected`
      : `${domainList.length} domain${domainList.length === 1 ? "" : "s"} available`;

  return (
    <>
      <SectionHeader
        className="d-flex align-items-center gap-2 mb-1 mt-4"
        icon={<GroupsIcon sx={{ fontSize: 18, color: "#7c3aed" }} />}
        title={isSharing ? "Department Access" : "Team Assignment"}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-faint)",
            backgroundColor: "var(--bg-hover)",
            padding: "2px 8px",
            borderRadius: 4,
          }}
        >
          {isSharing ? "Required" : "Optional"}
        </span>
      </SectionHeader>
      <p className="mb-3" style={{ fontSize: 12, color: "var(--text-muted)" }}>
        {isSharing
          ? "Every manager assigned to these departments will see this user. They assign the projects afterwards."
          : "You can assign projects now or do it later from the project page."}
      </p>

      {isSharing ? (
        domainList.length > 0 ? (
          <SelectionGrid
            summary={domainSummary}
            showClear={form.domains.length > 0}
            onClear={onClearDomains}
          >
            {domainList.map((domain) => (
              <SelectableCard
                key={domain.id}
                title={domain.name}
                subtitle={domain.description || "Department"}
                selected={form.domains.includes(String(domain.id))}
                onToggle={() => onToggleDomain(String(domain.id))}
              />
            ))}
          </SelectionGrid>
        ) : (
          <EmptyBox message="No departments available. Create a department first." />
        )
      ) : projectList.length > 0 ? (
        <SelectionGrid
          summary={projectSummary}
          showClear={form.projects.length > 0}
          onClear={onClearProjects}
        >
          {visibleProjects.length === 0 && (
            <p
              className="mb-0 text-center"
              style={{ fontSize: 12, color: "var(--text-faint)", padding: "16px 0" }}
            >
              {form.departments.length
                ? `No active projects in ${departmentLabel} yet.`
                : "Pick a department above to see its projects."}
            </p>
          )}
          {visibleProjects.map((proj) => (
            <SelectableCard
              key={proj.id}
              title={proj.name}
              subtitle={proj.description || proj.domain || "Project"}
              selected={form.projects.includes(proj.id)}
              onToggle={() => onToggleProject(proj.id)}
            />
          ))}
        </SelectionGrid>
      ) : (
        <EmptyBox message="No projects available. You can assign projects later." />
      )}
    </>
  );
};

export default TeamAssignmentSection;
