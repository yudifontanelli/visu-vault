import { createContext, ReactNode, useContext } from 'react';

import type { NavParams, SectionId } from './sections';

interface Navigator {
  section: SectionId;
  params: NavParams;
  go: (section: SectionId, params?: NavParams) => void;
  /** Asks the shell to confirm restoring the demo content. */
  requestReset: () => void;
}

const NavigationContext = createContext<Navigator>({ section: 'home', params: {}, go: () => undefined, requestReset: () => undefined });

export function NavigationProvider({ value, children }: { value: Navigator; children: ReactNode }) {
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

/** Cross-section navigation: open the desk on a story, the library on a plate… */
export function useNavigator() {
  return useContext(NavigationContext);
}
