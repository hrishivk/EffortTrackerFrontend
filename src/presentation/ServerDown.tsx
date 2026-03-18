import { useEffect, useState } from "react";
import { setServerDownCallback } from "../core/services/interceptors";
import axios from "axios";
import { API_URL } from "../config/apiEndpoints";

export default function ServerDown({
  children,
}: {
  children: React.ReactNode;
}) {
  const [down, setDown] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setServerDownCallback(setDown);
    axios
      .head(API_URL.apiService)
      .catch((err) => {
        if (!err.response) setDown(true);
      })
      .finally(() => setChecking(false));

    return () => setServerDownCallback(() => {});
  }, []);

  if (checking) return null;

  if (down) {
    return (
      <div className="error-page">
        <div className="error-page__orb error-page__orb--top-right" />
        <div className="error-page__orb error-page__orb--bottom-left" />
        <div className="error-page__orb error-page__orb--center" />
        <div className="error-page__grid" />

        <div className="error-page__content">
          <h1 className="error-page__code">503</h1>
          <div className="error-page__divider" />
          <h2 className="error-page__heading">Server Unavailable</h2>
          <p className="error-page__subtext">
            Oops! Something isn’t working right now. Our team is working on it.
            Please try again later
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
