import React, { createContext, useState, useContext } from 'react';

const MasterDataContext = createContext(null);

export const MasterDataProvider = ({ children }) => {
  const [masterData, setMasterData] = useState(null);
  const [isLoadingMasterData, setIsLoadingMasterData] = useState(true);
  const [masterDataError, setMasterDataError] = useState(null);

  const value = {
    masterData,
    setMasterData,
    isLoadingMasterData,
    setIsLoadingMasterData,
    masterDataError,
    setMasterDataError,
  };

  return (
    <MasterDataContext.Provider value={value}>
      {children}
    </MasterDataContext.Provider>
  );
};

export const useMasterData = () => {
  const context = useContext(MasterDataContext);
  if (!context) {
    throw new Error('useMasterData must be used within a MasterDataProvider');
  }
  return context;
};
