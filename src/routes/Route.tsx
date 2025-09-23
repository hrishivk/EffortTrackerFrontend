import React from "react";
import { Routes, Route } from "react-router-dom"; // ONLY import Route and Routes
const Login = React.lazy(() => import("../modules/auth/UserLogin"));
const Navbar = React.lazy(() => import("../presentation/Navbar"));
const ProtectedRoute = React.lazy(() => import("./ProtectRoute"));
import routes from "./RoleRoutes/roleRoute";

const Routers = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      {routes.map((route, idx) => (
        <Route
          key={idx}
          path={route.path}
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <route.element />
              </>
            </ProtectedRoute>
          }
        />
      ))}
    </Routes>
  );
};

export default Routers;
