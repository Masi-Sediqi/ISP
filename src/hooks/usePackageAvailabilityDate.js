import { useEffect, useState } from "react";
import { todayDateValue } from "../utils/afghanDate";

export function usePackageAvailabilityDate() {
  const [currentDate, setCurrentDate] = useState(todayDateValue);

  useEffect(() => {
    const refreshDate = () => setCurrentDate(todayDateValue());
    const intervalId = window.setInterval(refreshDate, 60_000);

    window.addEventListener("focus", refreshDate);
    document.addEventListener("visibilitychange", refreshDate);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshDate);
      document.removeEventListener("visibilitychange", refreshDate);
    };
  }, []);

  return currentDate;
}
