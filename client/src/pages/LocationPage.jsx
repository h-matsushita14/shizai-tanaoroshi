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
  const { masterData, isLoadingMasterData, masterDataError, setMasterData, setIsLoadingMasterData, setMasterDataError } = useMasterData();
  const locations = masterData?.locations || [];

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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    if (!isDesktop) {
        setSelectedStorageArea('');
        setSelectedLocation(null);
    }
  }, [selectedCategory, isDesktop]);

  useEffect(() => {
    if (!isLoadingMasterData && !masterDataError) {
      console.log("Fetched data structure:", locations);
    }
  }, [isLoadingMasterData, masterDataError, locations]);

  const handleStorageLocationSelect = (storageName, locationId) => {
    const availableMaps = ['出荷準備室', '資材室', '段ボール倉庫', '発送室', '包装室', '第二加工室'];
    if (availableMaps.includes(storageName)) {
      setSelectedLocation({
        name: storageName,
        svgPath: `/floor-plans/${storageName}.svg`
      });
      setIsFormDialogOpen(false);
      setSelectedLocationForForm(null);
    } else {
      setSelectedLocation(null);

      let foundLocation = null;
      let parentArea = null;

      for (const group of locations) {
        for (const area of group.storageAreas) {
          if (area.id === locationId) {
            foundLocation = area;
            parentArea = area;
            break;
          }
          const detail = area.details.find(d => d.id === locationId);
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
          id: locationId,
          name: parentArea.name,
          detail: foundLocation.name === parentArea.name ? '' : foundLocation.name,
          products: foundLocation.products || [] // 製品情報を追加
        });
        setIsFormDialogOpen(true);
      } else {
        console.log(`No matching location found for ID: ${locationId}`);
        setIsFormDialogOpen(false);
        setSelectedLocationForForm(null);
      }
    }
    if (isMobile || isTablet) {
      setMobileOpen(false);
    }
  };

  const handleAreaClickOnMap = (areaId) => {
    console.log("handleAreaClickOnMap called with:", areaId);
    let foundLocation = null;
    let parentArea = null;
    let parentCategory = null;

    for (const group of locations) {
      for (const area of group.storageAreas) {
        const detail = area.details.find(d => d.id === areaId);
        if (detail) {
          foundLocation = detail;
          parentArea = area;
          parentCategory = group.category;
          break;
        }
        if (area.id === areaId) {
          foundLocation = area;
          parentArea = area;
          parentCategory = group.category;
          break;
        }
      }
      if (foundLocation) break;
    }

    console.log("Found foundLocation:", foundLocation);
    console.log("Found parentArea:", parentArea);
    console.log("Found parentCategory:", parentCategory);

    if (foundLocation && parentArea && parentCategory) {
      const availableMaps = ['出荷準備室', '資材室', '段ボール倉庫', '発送室', '包装室', '第二加工室'];

      if (foundLocation.id === parentArea.id && availableMaps.includes(parentArea.name)) {
        setSelectedLocation({
          name: parentArea.name,
          svgPath: `/floor-plans/${parentArea.name}.svg`
        });
        setSelectedCategory(parentCategory);
        setSelectedStorageArea(parentArea.name);
        setIsFormDialogOpen(false);
        setSelectedLocationForForm(null);
      } else {
        setSelectedLocationForForm({
          id: areaId,
          name: parentArea.name,
          detail: foundLocation.name === parentArea.name ? '' : foundLocation.name,
          products: foundLocation.products || [] // 製品情報を追加
        });
        setIsFormDialogOpen(true);
        setSelectedCategory(parentCategory);
        setSelectedStorageArea(parentArea.name);
        console.log("Opening form dialog for:", areaId);
      }
    } else {
      console.log(`No matching location found for areaId: ${areaId}`);
      setIsFormDialogOpen(false);
      setSelectedLocationForForm(null);
    }
  };

  const handleCategoryChange = (category) => (event, isExpanded) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: isExpanded,
    }));
  };

  const handleStorageAreaChange = (areaId) => (event, isExpanded) => {
    setExpandedStorageAreas((prev) => ({
      ...prev,
      [areaId]: isExpanded,
    }));
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
                            onClick={() => handleStorageLocationSelect(area.name, area.id)}
                            sx={{ pl: 4 }}
                          >
                            <ListItemText 
                              primary={area.name} 
                              secondary={area.inventoryStatus === 'recorded' ? '入力済み' : ''}
                            />
                            {area.inventoryStatus === 'recorded' && <CheckCircleIcon color="success" sx={{ ml: 1 }} />}
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
            bottom: '56px',
            left: 0,
            right: 0,
          }}>
            
            {selectedCategory && (
              <Box sx={{ py: 1, flexShrink: 0, bgcolor: 'background.paper', zIndex: 1, boxShadow: 1 }}>
                <FormControl fullWidth>
                  <InputLabel id="storage-area-select-label">保管場所</InputLabel>
                  <Select
                    labelId="storage-area-select-label"
                    id="storage-area-select"
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
                            {area.inventoryStatus === 'recorded' && <CheckCircleIcon color="success" fontSize="small" />}
                          </Box>
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Box>
            )}

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
                      <Typography variant="h6" component="div">
                        ▲
                      </Typography>
                      <Typography variant="h6" component="div">
                        保管場所選択
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="h6" component="div">
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
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-around', overflowX: 'auto', position: 'relative' }}>
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
                    borderBottom: selectedCategory === group.category ? '2px solid white' : 'none',
                    position: 'relative',
                  }}
                >
                  {group.category}
                  {selectedCategory === group.category && (
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
        />
      )}
    </Box>
  );
}

export default LocationPage;
