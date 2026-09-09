import { useEffect, useState } from 'react';

/**
 * Delay a rapidly-changing value.
 *
 * Used for the search box: without it, every keystroke fires an API request,
 * and responses can arrive out of order.
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;
