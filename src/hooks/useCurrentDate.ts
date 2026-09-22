import { useEffect, useState } from 'react';
import { getCurrentDate } from '../utils/dates';

export function useCurrentDate() {
  const [today, setToday] = useState(getCurrentDate);
  useEffect(() => {
    const refresh = () => setToday(getCurrentDate());
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  return today;
}
