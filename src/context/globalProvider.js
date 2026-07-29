import { createContext, useContext, useEffect, useState } from "react";
import { addtionalApi } from "../api/apiService";

const GlobalContextProvider = createContext();

export const GlobalProvider = ({ children }) => {

  const [isDataLoading, setIsDataLoading] = useState(false);
  const [guestDataList, setGuestDataList] = useState(null);


  const getGuestDataForTable = async () => {
    try {
      setIsDataLoading(true);
      const res = await addtionalApi.getAllGuestData();

      if (res.status === 200) {
        const data = await res.data;
        setGuestDataList(data);
      }
      setIsDataLoading(false);
    } catch (error) {
      console.error("Guest Data Table Error");
      setIsDataLoading(false);
    }
  }

  useEffect(() => {
    getGuestDataForTable();
   }, []);

  return (
    <GlobalContextProvider.Provider
      value={{
        isDataLoading, setIsDataLoading,
        
        guestDataList, setGuestDataList,

        getGuestDataForTable,
      }}
    >
      {children}
    </GlobalContextProvider.Provider>
  )
}

export const useGlobalProvider = () => useContext(GlobalContextProvider);