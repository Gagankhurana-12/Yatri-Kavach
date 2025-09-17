import React, { createContext, useContext, useEffect, useState } from "react";

export type Coordinates = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  altitude?: number;
  timestamp?: number;
} | null;

type LocationContextType = {
  coords: Coordinates;
  setCoords: (c: Coordinates) => void;
};

const LocationContext = createContext<LocationContextType>({
  coords: null,
  setCoords: () => {},
});

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [coords, setCoords] = useState<Coordinates>(null);

  return (
    <LocationContext.Provider value={{ coords, setCoords }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => useContext(LocationContext);


