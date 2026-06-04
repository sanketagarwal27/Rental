import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const { user } = useAuth();
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | requesting | granted | denied | unavailable
  const [locationError, setLocationError] = useState(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLocationStatus("requesting");
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus("granted");
      },
      (err) => {
        setLocationStatus("denied");
        setLocationError(
          err.code === 1
            ? "Location access denied. Enable it in your browser settings."
            : "Unable to retrieve your location."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Automatically ask for location once the user is logged in
  useEffect(() => {
    if (user && locationStatus === "idle") {
      requestLocation();
    }
  }, [user, locationStatus, requestLocation]);

  return (
    <LocationContext.Provider
      value={{ coords, locationStatus, locationError, requestLocation }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
