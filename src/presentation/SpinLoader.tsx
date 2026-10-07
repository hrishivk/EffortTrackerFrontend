import { useEffect, useState } from "react";

import RxSpinner from "./RxSpinner";

interface LoaderBackdropProps {
  isLoading?: boolean;
  delay?: number;
  label?: string;
}

export default function SpinLoader({
  isLoading = false,
  delay = 300,
  label,
}: LoaderBackdropProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  if (!show) return null;

  return <RxSpinner size={110} color="#fff" label={label} />;
}
