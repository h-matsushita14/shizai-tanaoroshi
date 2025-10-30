import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Box, List, ListItemButton, ListItemText, CircularProgress,
  Alert, Drawer, Divider, Toolbar,
  Accordion, AccordionSummary, AccordionDetails,
  useMediaQuery, useTheme, FormControl, InputLabel, Select, MenuItem,
  AppBar, Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // 追加
import InteractiveMap from '../components/InteractiveMap';
import InventoryFormDialog from '../components/InventoryFormDialog';

import { sendGetRequest } from '../api/gas'; // sendGetRequestはonLocationsUpdatedで必要になるため残す
import { useMasterData } from '../contexts/MasterDataContext'; // useMasterData をインポート

// const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_API_URL; // 削除
// console.log("GAS_WEB_APP_URL:", GAS_WEB_APP_URL); // 削除
const drawerWidth = 240;
const mobileDrawerWidth = 180;

function LocationPage() {
  const { masterData, isLoadingMasterData, masterDataError, updateLocationsHierarchy, setMasterData } = useMasterData();
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (masterData?.locationsHierarchy) {
      setLocations(masterData.locationsHierarchy);
    }
  }, [masterData]);


  const [selectedLocation, setSelectedLocation] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedStorageAreas, setExpandedStorageAreas] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStorageArea, setSelectedStorageArea] = useState('');
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedLocationForForm, setSelectedLocationForForm] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleCategoryChange = (category) => (event, isExpanded) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: isExpanded,
    }));
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleStorageLocationSelect = (name, id) => {
    const availableMaps = ['資材室', '出荷準備室', '第二加工室', '段ボール倉庫', '発送室', '包装室'];
    if (availableMaps.includes(name)) {
      const svgPath = `/floor-plans/${name}.svg`;
      setSelectedLocation({
        id: id,
        name: name,
        svgPath: svgPath,
      });
      setIsFormDialogOpen(false);
      setSelectedLocationForForm(null);
    } else {
      setSelectedLocation(null);

      let foundLocation = null;
      let parentArea = null;

      for (const group of locations) {
        for (const area of group.storageAreas) {
          if (area.id === id) {
            foundLocation = area;
            parentArea = area;
            break;
          }
          const detail = area.details.find(d => d.id === id);
          if (detail) {
            foundLocation = detail;
            parentArea = area;
            break;
          }
        }
        if (foundLocation) break;
      }

      if (foundLocation && parentArea) {
        setSelectedLocationForForm({
          id: id,
          name: parentArea.name,
          detail: foundLocation.name === parentArea.name ? '' : foundLocation.name,
          products: foundLocation.products || [],
        });
        setIsFormDialogOpen(true);
      } else {
        console.log(`No matching location found for ID: ${id}`);
        setIsFormDialogOpen(false);
        setSelectedLocationForForm(null);
      }
    }
  };

  useEffect(() => {
    if (!isDesktop) {
        setSelectedStorageArea('');
        setSelectedLocation(null);
    }
  }, [selectedCategory, isDesktop]);

  // selectedLocationForForm (棚卸ダイアログの初期データ) を更新する関数
  const handleSaveSuccess = useCallback((savedRecords) => {
    if (!savedRecords || savedRecords.length === 0) return;

    // MasterDataContext の locationsHierarchy を直接更新する
    setMasterData(prevMasterData => {
      if (!prevMasterData || !prevMasterData.locationsHierarchy) return prevMasterData;

      const targetLocationId = savedRecords[0]["ロケーションID"]; // 保存されたレコードのロケーションIDを取得

      const newLocationsHierarchy = prevMasterData.locationsHierarchy.map(group => ({
        ...group,
        storageAreas: group.storageAreas.map(area => ({
          ...area,
          details: area.details.map(detail => {
            // 保存されたレコードのロケーションIDと一致する場合のみ更新
            if (detail.id === targetLocationId) {
              const updatedProducts = detail.products.map(product => {
                const savedRecord = savedRecords.find(rec => rec.商品コード === product.productCode);
                if (savedRecord) {
                  return {
                    ...product,
                    棚卸数量: (savedRecord.ロット数量 || 0) + (savedRecord.バラ数量 || 0),
                    記録日時: new Date(savedRecord.記録日時).toISOString(), // サーバーから返された記録日時を使用し、ISO文字列に変換
                  };
                }
                return product;
              });
              return { ...detail, products: updatedProducts };
            }
            return detail;
          }),
        })),
      }));

      return { ...prevMasterData, locationsHierarchy: newLocationsHierarchy };
    });

    // selectedLocationForForm の products も更新して、ダイアログを再度開いたときに最新の状態を反映させる
    setSelectedLocationForForm(prev => {
      if (!prev) return null;

      const updatedProducts = prev.products.map(product => {
        const savedRecord = savedRecords.find(rec => rec.商品コード === product.productCode);
        if (savedRecord) {
          return {
            ...product,
            棚卸数量: (savedRecord.ロット数量 || 0) + (savedRecord.バラ数量 || 0),
            記録日時: new Date(savedRecord.記録日時).toISOString(), // サーバーから返された記録日時を使用し、ISO文字列に変換
          };
        }
        return product;
      });

      return {
        ...prev,
        products: updatedProducts,
      };
    });
  }, [selectedLocationForForm, setMasterData]);

  const handleProductListUpdated = async () => {
    // 商品リスト更新後、MasterDataContext を更新するために、必要なデータのみをGASから再取得
    try {
      const updatedLocationsResult = await sendGetRequest('getLocations'); // getMasterData -> getLocations
      if (updatedLocationsResult.status === 'success') {
        updateLocationsHierarchy(updatedLocationsResult.data.locationsHierarchy); // result.data.locationsHierarchy -> result.data
        // MasterDataContext更新後、selectedLocationForFormも更新
        // updateSelectedLocationForForm(updatedLocationsResult.data); // result.data.locationsHierarchy -> result.data
      } else {
        throw new Error(updatedLocationsResult.message || 'ロケーションデータの再取得に失敗しました。');
      }
    } catch (err) {
      console.error('Failed to re-fetch location data after product list update:', err);
      // エラーハンドリング
    }
  };


  const currentDrawerWidth = isMobile ? mobileDrawerWidth : drawerWidth;

  const appBarHeight = theme.mixins.toolbar.minHeight;
  const pageTitleBoxHeight = 57;
  const desktopFixedHeaderHeight = `calc(${appBarHeight}px + ${pageTitleBoxHeight}px)`;
  const mobileFixedHeaderHeight = `${appBarHeight}px`;
  const effectiveFixedHeaderHeight = isDesktop ? desktopFixedHeaderHeight : mobileFixedHeaderHeight;

  const handleAreaClickOnMap = (locationId) => {
    if (!locations) return;

    let foundLocation = null;
    let parentAreaName = '';
    let detailName = '';

    for (const group of locations) {
      for (const area of group.storageAreas) {
        if (area.id === locationId) {
          foundLocation = area;
          parentAreaName = area.name;
          break;
        }
        const detail = area.details.find(d => d.id === locationId);
        if (detail) {
          foundLocation = detail;
          parentAreaName = area.name;
          detailName = detail.name;
          break;
        }
      }
      if (foundLocation) break;
    }

    if (foundLocation) {
      console.log('handleStorageLocationSelect: foundLocation.products', foundLocation.products);
      setSelectedLocationForForm({
        id: foundLocation.id,
        name: parentAreaName,
        detail: detailName,
        products: foundLocation.products || [],
      });
      setIsFormDialogOpen(true);
    } else {
      console.warn(`Location with ID: ${locationId} not found in master data.`);
      // 必要であれば、ユーザーに通知する処理を追加
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {isDesktop ? (
        <>
          <Drawer
            variant="permanent"
            open={true}
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              height: '100vh',
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
                mt: desktopFixedHeaderHeight,
                height: `calc(100vh - ${desktopFixedHeaderHeight})`,
                display: 'flex',
                flexDirection: 'column',
              },
            }}
            anchor="left"
          >
            <Toolbar />
            <Divider />
            <Typography variant="h6" sx={{ p: 2 }}>
              ロケーション一覧
            </Typography>
            <Divider />
            <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
              {isLoadingMasterData ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', m: 'auto', p: 2 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>ロケーションデータを読み込み中...</Typography>
                </Box>
              ) : masterDataError ? (
                <Alert severity="error" sx={{ m: 1 }}>{masterDataError}</Alert>
              ) : (
                <div>
                  {locations.map((group) => (
                    <Accordion
                      key={group.category}
                      expanded={expandedCategories[group.category] || false}
                      onChange={handleCategoryChange(group.category)}
                      sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls={`${group.category}-content`}
                        id={`${group.category}-header`}
                      >
                        <Typography>{group.category}</Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0 }}>
                        {group.storageAreas.map((area) => (
                          <ListItemButton
                            key={area.id}
                            onClick={() => handleStorageLocationSelect(area.name, area.id)}
                            sx={{ pl: 4 }}
                          >
                            <ListItemText 
                              primary={area.name} 
                              secondary={''}
                            />
                          </ListItemButton>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </div>
              )}
            </Box>
          </Drawer>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              bgcolor: 'background.default',
              mt: desktopFixedHeaderHeight,
              height: `calc(100vh - ${desktopFixedHeaderHeight})`,
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            {selectedLocation ? (
              <InteractiveMap
                key={selectedLocation.svgPath}
                svgPath={selectedLocation.svgPath}
                onAreaClick={handleAreaClickOnMap}
              />
            ) : (
              <Typography sx={{ p: 3 }}>左のリストから保管場所を選択してください。</Typography>
            )}
          </Box>
        </>
      ) : (
        <>
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            position: 'absolute',
            top: effectiveFixedHeaderHeight,
            bottom: '112px', // 新しいフッターの高さ分を確保
            left: 0,
            right: 0,
            height: `calc(100vh - ${effectiveFixedHeaderHeight} - 112px)` // 高さを再計算
          }}>
            
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                overflowY: 'hidden',
                p: 0,
                minHeight: 0
              }}
            >
              {isLoadingMasterData ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>ロケーションデータを読み込み中...</Typography>
                </Box>
              ) : masterDataError ? (
                <Alert severity="error" sx={{ m: 1 }}>{masterDataError}</Alert>
              ) : selectedLocation ? (
                <InteractiveMap
                  key={selectedLocation.svgPath}
                  svgPath={selectedLocation.svgPath}
                  onAreaClick={handleAreaClickOnMap}
                  isDesktop={isDesktop}
                />
              ) : (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  {selectedCategory ? (
                    <>
                      <Typography variant="h6" component="div" sx={{ mb: 1 }}> {/* mb を追加 */}
                        保管場所選択
                      </Typography>
                      <Typography variant="h6" component="div">
                        ▼
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="h6" component="div" sx={{ mb: 1 }}> {/* mb を追加 */}
                        ロケーション選択
                      </Typography>
                      <Typography variant="h6" component="div">
                        ▼
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          <AppBar position="fixed" color="primary" sx={{ top: 'auto', bottom: 0 }}>
            <Toolbar sx={{ flexDirection: 'column', alignItems: 'stretch', pt: 2 }}> {/* 2行構成にするためflexDirection: 'column' */}
              {/* 上の行: カテゴリ選択ボタン */}
              <Box sx={{ display: 'flex', justifyContent: 'space-around', overflowX: 'auto', position: 'relative', width: '100%', mb: 1 }}>
                {locations.map((group) => (
                  <Button
                    key={group.category}
                    color="inherit"
                    onClick={() => {
                      setSelectedCategory(group.category);
                    }}
                    sx={{
                      flexShrink: 0,
                      fontWeight: selectedCategory === group.category ? 'bold' : 'normal',
                      // borderBottom: selectedCategory === group.category ? '2px solid white' : 'none', // 削除
                      position: 'relative',
                    }}
                  >
                    {group.category}
                    {selectedCategory === group.category && ( // 復活
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -15,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          color: 'white',
                          fontSize: '1.5rem',
                          lineHeight: 1,
                        }}
                      >
                        ▼
                      </Box>
                    )}
                  </Button>
                ))}
              </Box>

              {/* 下の行: 保管場所選択欄 */}
              {selectedCategory && (
                <Box sx={{ flexShrink: 0, zIndex: 1, width: '100%', px: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel
                      id="storage-area-select-label"
                      sx={{
                        color: 'white',
                        '&.Mui-focused': {
                          color: 'white', // フォーカス時のラベル色
                        },
                        '&.Mui-active': {
                          color: 'white', // アクティブ時のラベル色
                        },
                      }}
                    >
                      保管場所
                    </InputLabel>
                    <Select
                      labelId="storage-area-select-label"
                      id="storage-area-area-select"
                      value={selectedStorageArea}
                      label="保管場所"
                      onChange={(e) => {
                        setSelectedStorageArea(e.target.value);
                        const selectedArea = locations
                          .find(group => group.category === selectedCategory)?.storageAreas
                          .find(area => area.name === e.target.value);
                      if (selectedArea) {
                        handleStorageLocationSelect(selectedArea.name, selectedArea.id);
                      }
                      }}
                      sx={{
                        color: 'white',
                        '.MuiOutlinedInput-notchedOutline': {
                          borderColor: 'white',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': { // ホバー時の枠線
                          borderColor: 'white',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { // フォーカス時の枠線
                          borderColor: 'white',
                        },
                        '.MuiSvgIcon-root': {
                          color: 'white',
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>選択してください</em>
                      </MenuItem>
                      {locations
                        .find(group => group.category === selectedCategory)?.storageAreas
                        .map((area) => (
                          <MenuItem key={area.id} value={area.name}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                              <Typography>{area.name}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </Toolbar>
          </AppBar>
        </>
      )}

      {selectedLocationForForm && (
        <InventoryFormDialog
          open={isFormDialogOpen}
          onClose={() => {
            setIsFormDialogOpen(false);
            setSelectedLocationForForm(null);
          }}
          locationId={selectedLocationForForm.id}
          locationName={selectedLocationForForm.name}
          locationDetail={selectedLocationForForm.detail}
          initialProducts={selectedLocationForForm.products} // 製品情報を追加
          onSaveSuccess={handleSaveSuccess}
          onProductListUpdated={handleProductListUpdated} // 追加
        />
      )}
    </Box>
  );
}

export default LocationPage;
