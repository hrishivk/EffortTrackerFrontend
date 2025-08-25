import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
const Login = React.lazy(() => import("../modules/auth/UserLogin"));
const Navbar = React.lazy(() => import("../presentation/Navbar"));
const ProtectedRoute = React.lazy(() => import("./ProtectRoute")); // path fix if needed
import routes from "./RoleRoutes/roleRoute";

const Routers = () => {
  return (
    <Router>
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
    </Router>
  );
};

export default Routers;
