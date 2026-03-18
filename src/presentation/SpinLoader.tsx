import { useEffect, useState } from "react";
import { Backdrop, CircularProgress } from "@mui/material";

interface LoaderBackdropProps {
  isLoading?: boolean;
  delay?: number;
}

export default function SpinLoader({ isLoading = false, delay = 300 }: LoaderBackdropProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  return (
    <Backdrop
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        color: "#fff",
      }}
      open={show}
    >
      <CircularProgress
        size={60}
        thickness={4}
        sx={{ color: "#fff" }}
      />
    </Backdrop>
  );
}
