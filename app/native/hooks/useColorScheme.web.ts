import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  let colorScheme;
  try {
    colorScheme = useRNColorScheme();
  } catch (error) {
    console.warn('useRNColorScheme failed, using default dark theme:', error);
    colorScheme = 'dark';
  }

  if (hasHydrated) {
    return colorScheme;
  }

  return 'dark'; // Default to dark theme to match app design
}
