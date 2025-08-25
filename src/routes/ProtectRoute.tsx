import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../store/configureStore";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
const user = useAppSelector((state) => state.user.user.email);
const isAuthenticated = Boolean(user && user.length);
return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
