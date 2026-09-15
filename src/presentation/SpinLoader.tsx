import { useEffect, useState } from "react";

import RxSpinner from "./RxSpinner";

interface LoaderBackdropProps {
  isLoading?: boolean;
  delay?: number;
  label?: string;
}

/**
 * The blocking loader every page uses.
 *
 * It is a thin gate around {@link RxSpinner}: the spinner draws the dimmed
 * sheet and centres itself, this decides whether it should be on screen at all.
 * The delay is the point — a load that finishes inside it never flashes a
 * loader, which reads as faster than showing one for 80ms.
 */
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
