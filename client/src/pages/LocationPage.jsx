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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStorageArea, setSelectedStorageArea] = useState('');
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedLocationForForm, setSelectedLocationForForm] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const handleCategoryChange = (category) => (event, isExpanded) => {
    setExpandedCategories(prev => ({ ...prev, [category]: isExpanded }));
  };

  const handleLocationSelect = (locationId) => {
    if (!masterData?.locationsHierarchy) {
      console.warn('locationsHierarchy is not ready.');
      return;
    }

    let foundLocation = null;
    let parentArea = null;
    let parentCategory = null; // ★ カテゴリを見つけるために追加

    for (const group of masterData.locationsHierarchy) {
      for (const area of group.storageAreas) {
        const detail = area.details.find(d => d.id === locationId);
        if (detail) {
          foundLocation = detail;
          parentArea = area;
          parentCategory = group.category; // ★ カテゴリを保持
          break;
        }
        if (area.id === locationId) {
          foundLocation = area;
          parentArea = area;
          parentCategory = group.category; // ★ カテゴリを保持
          break;
        }
      }
      if (foundLocation) break;
    }

    if (!foundLocation) {
      console.warn(`Location with ID: ${locationId} not found in hierarchy.`);
      return;
    }

    const availableMaps = ['資材室', '出荷準備室', '第二加工室', '段ボール倉庫', '発送室', '包装室'];

    if (foundLocation.id === parentArea.id && availableMaps.includes(parentArea.name)) {
      const svgPath = `/floor-plans/${parentArea.name}.svg`;
      setSelectedLocation({
        id: locationId,
        name: parentArea.name,
        svgPath: svgPath,
      });
      // ★★★ UIの状態を連動させる処理を復活 ★★★
      setSelectedCategory(parentCategory);
      setSelectedStorageArea(parentArea.name);
      
      setIsFormDialogOpen(false);
      setSelectedLocationForForm(null);
    } else {
      setSelectedLocationForForm({
        id: locationId,
        name: parentArea.name,
        detail: foundLocation.name === parentArea.name ? '' : foundLocation.name,
        products: foundLocation.products || [],
      });
      setIsFormDialogOpen(true);
    }
  };

  const handleAreaClickOnMap = (locationId) => {
    handleLocationSelect(locationId);
  };

  const handleStorageLocationSelectFromMenu = (name, id) => {
    handleLocationSelect(id);
  };

  useEffect(() => {
    if (!isDesktop) {
      setSelectedStorageArea('');
      setSelectedLocation(null);
    }
  }, [selectedCategory, isDesktop]);

  const handleSaveSuccess = useCallback((savedRecords) => {
    if (!savedRecords || savedRecords.length === 0) return;

    setMasterData(prevMasterData => {
      if (!prevMasterData || !prevMasterData.locationsHierarchy) return prevMasterData;

      const targetLocationId = savedRecords[0]["ロケーションID"];

      const newLocationsHierarchy = prevMasterData.locationsHierarchy.map(group => ({
        ...group,
        storageAreas: group.storageAreas.map(area => {
          if (area.id === targetLocationId) {
            const updatedProducts = area.products.map(product => {
              const savedRecord = savedRecords.find(rec => rec.商品コード === product.productCode);
              return savedRecord ? { ...product, 棚卸数量: (savedRecord.ロット数量 || 0) + (savedRecord.バラ数量 || 0), 記録日時: new Date(savedRecord.記録日時).toISOString() } : product;
            });
            return { ...area, products: updatedProducts };
          }
          const updatedDetails = area.details.map(detail => {
            if (detail.id === targetLocationId) {
              const updatedProducts = detail.products.map(product => {
                const savedRecord = savedRecords.find(rec => rec.商品コード === product.productCode);
                return savedRecord ? { ...product, 棚卸数量: (savedRecord.ロット数量 || 0) + (savedRecord.バラ数量 || 0), 記録日時: new Date(savedRecord.記録日時).toISOString() } : product;
              });
              return { ...detail, products: updatedProducts };
            }
            return detail;
          });
          return { ...area, details: updatedDetails };
        }),
      }));

      return { ...prevMasterData, locationsHierarchy: newLocationsHierarchy };
    });

    setSelectedLocationForForm(prev => {
      if (!prev) return null;
      const updatedProducts = prev.products.map(product => {
        const savedRecord = savedRecords.find(rec => rec.商品コード === product.productCode);
        return savedRecord ? { ...product, 棚卸数量: (savedRecord.ロット数量 || 0) + (savedRecord.バラ数量 || 0), 記録日時: new Date(savedRecord.記録日時).toISOString() } : product;
      });
      return { ...prev, products: updatedProducts };
    });
  }, [setMasterData]);

  const handleProductListUpdated = async () => {
    try {
      const updatedLocationsResult = await sendGetRequest('getLocations');
      if (updatedLocationsResult.status === 'success') {
        updateLocationsHierarchy(updatedLocationsResult.data.locationsHierarchy);
      } else {
        throw new Error(updatedLocationsResult.message || 'ロケーションデータの再取得に失敗しました。');
      }
    } catch (err) {
      console.error('Failed to re-fetch location data after product list update:', err);
    }
  };

  const currentDrawerWidth = isMobile ? mobileDrawerWidth : drawerWidth;
  const appBarHeight = theme.mixins.toolbar.minHeight;
  const pageTitleBoxHeight = 57;
  const desktopFixedHeaderHeight = `calc(${appBarHeight}px + ${pageTitleBoxHeight}px)`;
  const mobileFixedHeaderHeight = `${appBarHeight}px`;
  const effectiveFixedHeaderHeight = isDesktop ? desktopFixedHeaderHeight : mobileFixedHeaderHeight;

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
                            onClick={() => handleStorageLocationSelectFromMenu(area.name, area.id)}
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
            bottom: '112px',
            left: 0,
            right: 0,
            height: `calc(100vh - ${effectiveFixedHeaderHeight} - 112px)`
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
                      <Typography variant="h6" component="div" sx={{ mb: 1 }}>保管場所選択</Typography>
                      <Typography variant="h6" component="div">▼</Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="h6" component="div" sx={{ mb: 1 }}>ロケーション選択</Typography>
                      <Typography variant="h6" component="div">▼</Typography>
                    </>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          <AppBar position="fixed" color="primary" sx={{ top: 'auto', bottom: 0 }}>
            <Toolbar sx={{ flexDirection: 'column', alignItems: 'stretch', pt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', overflowX: 'auto', position: 'relative', width: '100%', mb: 1 }}>
                {locations.map((group) => (
                  <Button
                    key={group.category}
                    color="inherit"
                    onClick={() => setSelectedCategory(group.category)}
                    sx={{
                      flexShrink: 0,
                      fontWeight: selectedCategory === group.category ? 'bold' : 'normal',
                      position: 'relative',
                    }}
                  >
                    {group.category}
                    {selectedCategory === group.category && (
                      <Box sx={{ position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%)', color: 'white', fontSize: '1.5rem', lineHeight: 1 }}>▼</Box>
                    )}
                  </Button>
                ))}
              </Box>

              {selectedCategory && (
                <Box sx={{ flexShrink: 0, zIndex: 1, width: '100%', px: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel id="storage-area-select-label" sx={{ color: 'white', '&.Mui-focused': { color: 'white' }, '&.Mui-active': { color: 'white' } }}>
                      保管場所
                    </InputLabel>
                    <Select
                      labelId="storage-area-select-label"
                      id="storage-area-area-select"
                      value={selectedStorageArea}
                      label="保管場所"
                      onChange={(e) => {
                        setSelectedStorageArea(e.target.value);
                        const selectedArea = locations.find(group => group.category === selectedCategory)?.storageAreas.find(area => area.name === e.target.value);
                        if (selectedArea) {
                          handleStorageLocationSelectFromMenu(selectedArea.name, selectedArea.id);
                        }
                      }}
                      sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '.MuiSvgIcon-root': { color: 'white' } }}
                    >
                      <MenuItem value=""><em>選択してください</em></MenuItem>
                      {locations.find(group => group.category === selectedCategory)?.storageAreas.map((area) => (
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
          initialProducts={selectedLocationForForm.products}
          onSaveSuccess={handleSaveSuccess}
          onProductListUpdated={handleProductListUpdated}
        />
      )}
    </Box>
  );
}

export default LocationPage;
