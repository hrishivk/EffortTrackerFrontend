
import { Backdrop, CircularProgress } from "@mui/material";

interface LoaderBackdropProps {
  isLoading: boolean;
}

export default function SpinLoader({ isLoading }: LoaderBackdropProps) {
  return (
    <Backdrop
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        color: "#fff",
      }}
      open={isLoading}
    >
      <CircularProgress
        size={60}
        thickness={4}
        sx={{
          color: "#fff",
        }}
      />
    </Backdrop>
  );
}
