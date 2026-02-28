import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

const Login = React.lazy(() => import("../modules/auth/components/UserLogin"));
const AppLayout = React.lazy(() => import("../presentation/AppLayout"));
const ProtectedRoute = React.lazy(() => import("./ProtectRoute"));
const NotFound = React.lazy(() => import("../presentation/NotFound"));

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
              <ProtectedRoute allowedRoles={route.roles}>
                <AppLayout>
                  <PageWrapper>
                    <route.element />
                  </PageWrapper>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

export default Routers;
