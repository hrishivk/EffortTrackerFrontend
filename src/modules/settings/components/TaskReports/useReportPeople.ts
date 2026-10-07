import { useCallback, useMemo, useRef, useState } from "react";
import { fetchUsers } from "../../../../core/actions/spAction";
import { PEOPLE_PAGE, type Person } from "./constants";

type Options = {
  canSeeOthers: boolean;
  isAM: boolean;
  selfId: string | number | null | undefined;
  showSnackbar: (opts: { message: string; severity: "error" }) => void;
};

/** Paged, searchable list of people the current user may report on. */
export const useReportPeople = ({ canSeeOthers, isAM, selfId, showSnackbar }: Options) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [peoplePage, setPeoplePage] = useState(1);
  const [peoplePages, setPeoplePages] = useState(1);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleSearch, setPeopleSearch] = useState("");
  const peopleLoaded = useRef(false);

  const reportable = useCallback(
    (rows: Person[]) =>
      rows.filter((p) => {
        if (String(p.id) === String(selfId ?? "")) return false;
        if (!isAM) return true;
        const r = String(p.role ?? "").toUpperCase();
        return r === "USER" || r === "DEVLOPER";
      }),
    [isAM, selfId]
  );

  const loadPeoplePage = useCallback(
    async (page: number, search = peopleSearch) => {
      if (!canSeeOthers) return;
      setPeopleLoading(true);
      try {
        const res = await fetchUsers({
          page,
          limit: PEOPLE_PAGE,
          ...(search ? { search } : {}),
        });
        setPeople(reportable(res?.users ?? []));
        setPeoplePage(page);
        setPeoplePages(res?.totalPages || 1);
      } catch {
        showSnackbar({ message: "Could not load the team list", severity: "error" });
      } finally {
        setPeopleLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canSeeOthers, peopleSearch, reportable]
  );

  const openPeople = useCallback(() => {
    if (peopleLoaded.current || peopleLoading) return;
    peopleLoaded.current = true;
    void loadPeoplePage(1).catch(() => {
      peopleLoaded.current = false;
    });
  }, [peopleLoading, loadPeoplePage]);

  const searchPeople = useCallback(
    (query: string) => {
      if (query === peopleSearch) return;
      setPeopleSearch(query);
      peopleLoaded.current = true;
      void loadPeoplePage(1, query);
    },
    [peopleSearch, loadPeoplePage]
  );

  const pickablePeople = useMemo(
    () =>
      people.map((p) => ({
        id: String(p.id),
        name: p.fullName || p.email || "Unknown",
        role: p.role,
      })),
    [people]
  );

  return {
    people,
    pickablePeople,
    peoplePage,
    peoplePages,
    peopleLoading,
    loadPeoplePage,
    openPeople,
    searchPeople,
  };
};

export type ReportPeople = ReturnType<typeof useReportPeople>;
