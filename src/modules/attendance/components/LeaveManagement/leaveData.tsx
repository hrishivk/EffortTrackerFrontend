import {
  MdOutlineMoneyOff,
  MdOutlineBeachAccess,
  MdOutlineWorkOff,
  MdOutlineWork,
} from "react-icons/md";

export interface LeaveCard {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  available: number;
  total?: number;
  booked: number;
}

export interface Holiday {
  date: string;
  day: string;
  name: string;
}

export const leaveCards: LeaveCard[] = [
  {
    title: "LEAVE WITHOUT PAY",
    icon: <MdOutlineMoneyOff size={22} />,
    iconBg: "#fee2e2",
    available: 0,
    booked: 0,
  },
  {
    title: "CASUAL LEAVE",
    icon: <MdOutlineBeachAccess size={22} />,
    iconBg: "#ffedd5",
    available: 0,
    total: 8,
    booked: 0,
  },
  {
    title: "COMPENSATORY OFF",
    icon: <MdOutlineWorkOff size={22} />,
    iconBg: "#f3e8ff",
    available: 0,
    booked: 0,
  },
  {
    title: "ON DUTY",
    icon: <MdOutlineWork size={22} />,
    iconBg: "#dbeafe",
    available: 0,
    booked: 0,
  },
];

export const upcomingHolidays: Holiday[] = [
  { date: "14-Apr-2026", day: "Tuesday", name: "Tamil New Year" },
  { date: "01-May-2026", day: "Friday", name: "May Day" },
  { date: "15-Aug-2026", day: "Saturday", name: "Independence Day" },
  { date: "14-Sep-2026", day: "Monday", name: "Vinayagar Chaturthi" },
];

export const pastHolidays: Holiday[] = [
  { date: "26-Jan-2026", day: "Monday", name: "Republic Day" },
  { date: "15-Jan-2026", day: "Thursday", name: "Pongal" },
];

export const iconColors: Record<string, string> = {
  "#fee2e2": "#ef4444",
  "#ffedd5": "#f97316",
  "#f3e8ff": "#a855f7",
  "#dbeafe": "#3b82f6",
};
