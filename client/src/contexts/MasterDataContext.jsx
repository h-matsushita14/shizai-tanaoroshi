import React, { createContext, useState, useContext, useCallback } from 'react';

const MasterDataContext = createContext(null);

export const MasterDataProvider = ({ children }) => {
  const [masterData, setMasterData] = useState(null);
  const [isLoadingMasterData, setIsLoadingMasterData] = useState(true);
  const [masterDataError, setMasterDataError] = useState(null);

  const updateProducts = useCallback((newProducts) => {
    setMasterData(prevData => ({ ...prevData, products: newProducts }));
  }, []);

  const updateSuppliers = useCallback((newSuppliers) => {
    setMasterData(prevData => ({ ...prevData, suppliers: newSuppliers }));
  }, []);

  const updateLocationsMaster = useCallback((newLocationsMaster) => {
    setMasterData(prevData => ({ ...prevData, locationsMaster: newLocationsMaster }));
  }, []);

  const updateLocationProductMappings = useCallback((newMappings) => {
    setMasterData(prevData => ({ ...prevData, locationProductMappings: newMappings }));
  }, []);

  const value = {
    masterData,
    setMasterData,
    isLoadingMasterData,
    setIsLoadingMasterData,
    masterDataError,
    setMasterDataError,
    updateProducts,
    updateSuppliers,
    updateLocationsMaster,
    updateLocationProductMappings,
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
