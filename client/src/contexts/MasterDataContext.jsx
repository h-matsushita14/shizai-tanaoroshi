import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { sendGetRequest } from '../api/gas'; // sendGetRequest をインポート

const MasterDataContext = createContext(null);

export const MasterDataProvider = ({ children }) => {
  const [masterData, setMasterData] = useState(null);
  const [isLoadingMasterData, setIsLoadingMasterData] = useState(true);
  const [masterDataError, setMasterDataError] = useState(null);

  // アプリケーション起動時にマスターデータをフェッチ
  useEffect(() => {
    const fetchInitialMasterData = async () => {
      try {
        const result = await sendGetRequest('getMasterData');
        if (result.status === 'success') {
          setMasterData({
            products: result.data.products,
            suppliers: result.data.suppliers,
            locationsMaster: result.data.locationsMaster, // Location_Masterシートの生データ
            locationsHierarchy: result.data.locationsHierarchy, // 階層構造のロケーションデータ
            locationProductMappings: result.data.locationProductMappings,
          });
        } else {
          throw new Error(result.message || 'マスターデータの取得に失敗しました。');
        }
      } catch (err) {
        console.error('Failed to fetch initial master data:', err);
        setMasterDataError(err.message);
      } finally {
        setIsLoadingMasterData(false);
      }
    };

    fetchInitialMasterData();
  }, []); // コンポーネントのマウント時に一度だけ実行

  const updateProducts = useCallback((newProducts) => {
    setMasterData(prevData => ({ ...prevData, products: newProducts }));
  }, []);

  const updateSuppliers = useCallback((newSuppliers) => {
    setMasterData(prevData => ({ ...prevData, suppliers: newSuppliers }));
  }, []);

  const updateLocationsMaster = useCallback((newLocationsMaster) => {
    setMasterData(prevData => ({ ...prevData, locationsMaster: newLocationsMaster }));
  }, []);

  const updateLocationsHierarchy = useCallback((newLocationsHierarchy) => {
    setMasterData(prevData => ({ ...prevData, locationsHierarchy: newLocationsHierarchy }));
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
    updateLocationsHierarchy,
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
