import React, { createContext, useContext, useState } from "react";

interface DebugContextType {
  debug: boolean;
  toggleDebug: () => void;
}

const DebugContext = createContext<DebugContextType>({
  debug: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  toggleDebug: () => {},
});

export const DebugProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [debug, setDebug] = useState(false);
  const toggleDebug = () => setDebug((d) => !d);
  return (
    <DebugContext.Provider value={{ debug, toggleDebug }}>
      {children}
    </DebugContext.Provider>
  );
};

export const useDebug = (): DebugContextType => useContext(DebugContext);

export default DebugContext;
