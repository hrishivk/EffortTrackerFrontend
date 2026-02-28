import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../store/configureStore";
import Unauthorized from "../presentation/Unauthorized";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const email = useAppSelector((state) => state.user.user.email);
  const token = useAppSelector((state) => state.user.token);
  const role = useAppSelector((state) => state.user.user.role);

  const isAuthenticated = Boolean(email && email.length && token && token.length);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some(
      (r) => r.toUpperCase() === role.toUpperCase()
    );
    if (!hasAccess) {
      return <Unauthorized />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
