import { Link } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";
import { ActiveGlow, Collapse } from "./sidebarMotion";
import type { NavItem, NavSection, SidebarViewProps, ToggleMap } from "./types";

interface NavSectionsProps extends SidebarViewProps {
  sections: NavSection[];
  pathname: string;
  closed: ToggleMap;
  onToggleSection: (title: string) => void;
  shutBranches: ToggleMap;
  onToggleBranch: (to: string) => void;
}

const samePath = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

interface NavRowProps extends SidebarViewProps {
  item: NavItem;
  isActive: boolean;
}

const NavRow = ({ item, isActive, isCollapsed, pillId, onClose }: NavRowProps) => (
  <Link
    to={item.to}
    onClick={onClose}
    title={isCollapsed ? item.label : undefined}
    className={`sb-item${
      isActive
        ? isCollapsed
          ? " sb-item--active sb-item--active-rail"
          : " sb-item--active"
        : ""
    } ${
      isCollapsed
        ? "justify-center h-[34px] w-[34px] mx-auto"
        : "gap-2 h-[34px] px-2.5 text-[12.5px]"
    }`}
  >
    {isActive && (
      <ActiveGlow
        layoutId={pillId}
        className="absolute inset-0"
        style={{
          background: isCollapsed
            ? "linear-gradient(135deg, #7c3aed, #a855f7)"
            : "rgba(124, 58, 237, 0.1)",
          boxShadow: isCollapsed ? "0 4px 12px rgba(124, 58, 237, 0.3)" : "none",
        }}
      />
    )}

    <span className="sb-item__icon">{item.icon}</span>
    {!isCollapsed && <span className="sb-item__label">{item.label}</span>}
  </Link>
);

const NavSections = ({
  sections,
  pathname,
  closed,
  onToggleSection,
  shutBranches,
  onToggleBranch,
  ...view
}: NavSectionsProps) => {
  const { isCollapsed, pillId, onClose } = view;

  return (
    <>
      {sections.map((section, sectionIdx) => {
        const isShut = !isCollapsed && !!closed[section.title];
        return (
          <div key={section.title} className="mb-4 last:mb-0">
            {isCollapsed ? (
              sectionIdx > 0 && (
                <div
                  className="mx-auto mb-3 h-px w-6"
                  style={{ backgroundColor: "var(--border-light)" }}
                />
              )
            ) : (
              <button
                type="button"
                onClick={() => onToggleSection(section.title)}
                className={`sb-caption${isShut ? " sb-caption--closed" : ""}`}
                title={isShut ? `Show ${section.title}` : `Hide ${section.title}`}
              >
                {section.title}
                <span className="sb-caption__chevron">
                  <FiChevronDown size={11} />
                </span>
              </button>
            )}

            <Collapse open={!isShut}>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const kids = isCollapsed ? [] : item.children ?? [];
                  const isActive = kids.length
                    ? samePath(pathname, item.to)
                    : pathname.toLowerCase().startsWith(item.to.toLowerCase());

                  if (!kids.length) {
                    return <NavRow key={item.to} item={item} isActive={isActive} {...view} />;
                  }

                  const branchOpen = !shutBranches[item.to];
                  return (
                    <div key={item.to} className="sb-branch">
                      <div className="sb-branch__row">
                        <NavRow item={item} isActive={isActive} {...view} />
                        <button
                          type="button"
                          className={`sb-branch__caret${
                            branchOpen ? " sb-branch__caret--open" : ""
                          }`}
                          title={branchOpen ? "Collapse" : "Expand"}
                          onClick={() => onToggleBranch(item.to)}
                        >
                          <FiChevronDown size={11} />
                        </button>
                      </div>

                      <Collapse open={branchOpen}>
                        <div className="sb-tree__kids">
                          {kids.map((kid) => {
                            const on = samePath(pathname, kid.to);
                            return (
                              <Link
                                key={kid.to}
                                to={kid.to}
                                onClick={onClose}
                                className={`sb-tree__leaf${on ? " sb-tree__leaf--active" : ""}`}
                              >
                                {on && <ActiveGlow layoutId={pillId} />}
                                {kid.icon}
                                {kid.label}
                              </Link>
                            );
                          })}
                        </div>
                      </Collapse>
                    </div>
                  );
                })}
              </div>
            </Collapse>
          </div>
        );
      })}
    </>
  );
};

export default NavSections;
