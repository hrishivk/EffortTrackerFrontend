import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

const Login = React.lazy(() => import("../modules/auth/UserLogin"));
const AppLayout = React.lazy(() => import("../presentation/AppLayout"));
const ProtectedRoute = React.lazy(() => import("./ProtectRoute"));

import routes from "./RoleRoutes/roleRoute";
import PageWrapper from "../presentation/PageWraper";

const Routers = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageWrapper>
              <Login />
            </PageWrapper>
          }
        />
        {routes.map((route, idx) => (
          <Route
            key={idx}
            path={route.path}
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PageWrapper>
                    <route.element />
                  </PageWrapper>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        ))}
      </Routes>
    </AnimatePresence>
  );
};

export default Routers;
