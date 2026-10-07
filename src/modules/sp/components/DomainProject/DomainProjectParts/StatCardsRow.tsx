import { FolderKanban, PauseCircle, Target, UsersRound } from "lucide-react";
import StatCard from "../StatCard";
import type { ProjectStats } from "./projectMappers";

type Props = {
  stats: ProjectStats | null;
};

const StatCardsRow = ({ stats }: Props) => {
  const cards = [
    {
      title: "Active Projects",
      value: stats?.projects.active ?? 0,
      subtitle: `${stats?.projects.total ?? 0} total projects`,
      accentColor: "#7c3aed",
      icon: <FolderKanban size={18} strokeWidth={2.1} />,
    },
    {
      title: "On Hold",
      value: stats?.projects.on_hold ?? 0,
      subtitle: "Awaiting feedback",
      accentColor: "#f59e0b",
      icon: <PauseCircle size={18} strokeWidth={2.1} />,
    },
    {
      title: "Total Completion",
      value: `${stats?.totalCompletion ?? 0}%`,
      progress: stats?.totalCompletion ?? 0,
      accentColor: "#10b981",
      icon: <Target size={18} strokeWidth={2.1} />,
    },
    {
      title: "Active Resources",
      value: stats?.activeResources ?? 0,
      subtitle: "Allocated across teams",
      accentColor: "#6366f1",
      icon: <UsersRound size={18} strokeWidth={2.1} />,
    },
  ];

  return (
    <div className="scrollbar-hide" style={{ display: "flex", gap: 16, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
      {cards.map((card) => (
        <div key={card.title} style={{ minWidth: 200, flex: "1 0 auto" }}>
          <StatCard {...card} />
        </div>
      ))}
    </div>
  );
};

export default StatCardsRow;
