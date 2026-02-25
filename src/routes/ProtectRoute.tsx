import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../store/configureStore";

interface ProtectedRouteProps {
  children: ReactNode;
}
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
const email = useAppSelector((state) => state.user.user.email);
const token = useAppSelector((state) => state.user.token);
const isAuthenticated = Boolean(email && email.length && token && token.length);
return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
