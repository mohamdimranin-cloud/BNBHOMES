import { createContext, useContext, useEffect, useState } from "react";

const StateContextProvider = createContext();

export const ContextProvider = ({ children }) => {

  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem("userToken") || null);
  // const [isSessionExpired, setIsSessionExpired] = useState(false);
  // const [roomData, setRoomData] = useState(null);
  // const [roomStatusCount, setRoomStatusCount] = useState({ occupiedCount: 0, unOccupiedCount: 0 });
  // const [statusCount, setStatusCount] = useState([]);
  // const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSavingCheckIn, setIsSavingCheckIn] = useState(false);

  const handleLogOut = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userRole");
    setIsLoggedIn(false);
  }

  // const fetchRoomData = async () => {
  //   try {
  //     setIsDataLoaded(true);
  //     const res = await roomApi.getAllRomms();
  //     if (res.status === 200) {
  //       const data = await res.data;
  //       const sortedData = sortData(data);
  //       // setRoomData(sortedData);
  //       const { occupied, unoccupied } = calculateRoomStatus(sortedData);
  //       // setRoomStatusCount({ occupiedCount: occupied, unOccupiedCount: unoccupied });
  //       // setStatusCount(calculateTotalStatusCount(sortedData));
  //       setIsDataLoaded(false);

  //       return {"roomData": sortedData, "roomStatusCount": { occupiedCount: occupied, unOccupiedCount: unoccupied }, "statusCount": calculateTotalStatusCount(sortedData)}
  //     }
  //   } catch (error) {
  //     console.log("Room Data fetch error: " + error);
  //     toast.error("Room Data fetch error");
  //     setIsDataLoaded(false);
  //   }
  // }

  useEffect(() => {
    const checkIsLoggedIn = async () => {
      // const valid = await verifyUserToken();
      const valid = localStorage.getItem("userToken");

      if (valid === null) {
        console.log(valid);

        setIsLoggedIn(false);
        // setIsSessionExpired(true);
      }
    }
    checkIsLoggedIn();
  }, []);

  return (
    <StateContextProvider.Provider
      value={{
        isLoggedIn, setIsLoggedIn,
        // isSessionExpired, setIsSessionExpired,
        // roomData, setRoomData,
        // roomStatusCount, setRoomStatusCount,
        // statusCount, setStatusCount,
        isSavingCheckIn, setIsSavingCheckIn,

        handleLogOut,
      }}
    >
      {children}
    </StateContextProvider.Provider>
  )
}

export const useContextProvider = () => useContext(StateContextProvider);