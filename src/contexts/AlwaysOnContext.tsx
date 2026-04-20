import { createContext, useContext } from 'react';

export const AlwaysOnContext = createContext(false);
export const useAlwaysOn = () => useContext(AlwaysOnContext);
