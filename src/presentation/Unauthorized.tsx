import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/configureStore";

const DASHBOARD_MAP: Record<string, string> = {
  SP: "/sp/dashboard",
  AM: "/am/dashboard",
  USER: "/user/dashboard",
  DEVLOPER: "/user/dashboard",
};

const Unauthorized = () => {
  const navigate = useNavigate();
  const role = useAppSelector((state) => state.user.user.role);
  const dashboardPath = DASHBOARD_MAP[role] || "/";

  return (
    <div className="error-page">
      <div className="error-page__orb error-page__orb--top-right" />
      <div className="error-page__orb error-page__orb--bottom-left" />
      <div className="error-page__orb error-page__orb--center" />
      <div className="error-page__grid" />

      <div className="error-page__content">
        <h1 className="error-page__code">403</h1>
        <div className="error-page__divider" />
        <h2 className="error-page__heading">Access Denied</h2>
        <p className="error-page__subtext">
          You don't have permission to access this page. Please contact your
          administrator if you believe this is an error.
        </p>

        <div className="error-page__actions">
          <button
            className="error-page__btn"
            onClick={() => navigate(dashboardPath)}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
