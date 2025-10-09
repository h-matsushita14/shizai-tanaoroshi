import React, { useState, useEffect } from 'react';
import {
  Typography, Box, List, ListItemButton, ListItemText, CircularProgress,
  Alert, Drawer, Divider, Toolbar,
  Accordion, AccordionSummary, AccordionDetails,
  useMediaQuery, useTheme, FormControl, InputLabel, Select, MenuItem,
  AppBar, Button // 新しくインポート
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InteractiveMap from '../components/InteractiveMap';
import InventoryFormDialog from '../components/InventoryFormDialog'; // 追加

const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL;
const drawerWidth = 240; // PC/タブレットでのドロワーの幅
const mobileDrawerWidth = 180; // スマホでのドロワーの幅 (必要に応じて調整)

function LocationPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null); // For the map display
  const [expandedCategories, setExpandedCategories] = useState({}); // カテゴリのアコーディオン展開状態
  const [expandedStorageAreas, setExpandedStorageAreas] = useState({}); // 保管場所のアコーディオン展開状態
  const [selectedCategory, setSelectedCategory] = useState(''); // タブレット・スマホ用
  const [selectedStorageArea, setSelectedStorageArea] = useState(''); // タブレット・スマホ用

  // 棚卸入力フォームダイアログ関連のstate
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedLocationForForm, setSelectedLocationForForm] = useState(null); // ダイアログに渡すロケーション情報

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // スマホ (sm 未満)
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // タブレット (sm 以上 md 未満)
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // PC (md 以上)
  const [mobileOpen, setMobileOpen] = useState(false); // モバイルドロワーの開閉状態

  // モバイルドロワーの開閉ハンドラ
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    const fetchLocations = async () => {
      if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
        setError('GASのウェブアプリURLが設定されていません。');
        setLoading(false);
        return;
      }
      try {
        const requestUrl = `${GAS_WEB_APP_URL}?action=getLocations`;
        console.log("Requesting URL:", requestUrl);

        const response = await fetch(requestUrl);
        const result = await response.json();

        console.log("Response from Google Apps Script:", result);

        if (result.status === 'success') {
          setLocations(result.data);
        } else {
          throw new Error(result.message || 'データの取得に失敗しました。');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  // selectedCategory が変更されたら selectedStorageArea をリセット
  useEffect(() => {
    // This effect is mainly for the mobile view with dropdowns.
    // For the footer button UI, the reset is handled in the onClick.
    if (!isDesktop) {
        setSelectedStorageArea('');
        setSelectedLocation(null);
    }
  }, [selectedCategory, isDesktop]);

  useEffect(() => {
    if (!loading && !error) {
      console.log("Fetched data structure:", locations);
    }
  }, [loading, error, locations]);

  // Called when a storage location (e.g., "資材室") is clicked in the accordion
  const handleStorageLocationSelect = (storageName, locationId) => {
    const availableMaps = ['出荷準備室', '資材室', '段ボール倉庫', '発送室', '包装室', '第二加工室'];
    if (availableMaps.includes(storageName)) {
      setSelectedLocation({
        name: storageName,
        svgPath: `/floor-plans/${storageName}.svg`
      });
      // マップ表示時はフォームを閉じる
      setIsFormDialogOpen(false);
      setSelectedLocationForForm(null);
    } else {
      // マップがない場合はフォームダイアログを開く
      setSelectedLocation(null); // マップを非表示

      let foundLocation = null; // 見つかったロケーションオブジェクト (area または detail)
      let parentArea = null; // 見つかったロケーションの親の保管場所オブジェクト

      // locationsデータからlocationIdに対応する保管場所または詳細を検索
      for (const group of locations) {
        for (const area of group.storageAreas) {
          if (area.id === locationId) { // locationIdが保管場所のIDと一致する場合
            foundLocation = area;
            parentArea = area;
            break;
          }
          const detail = area.details.find(d => d.id === locationId);
          if (detail) { // locationIdが詳細のIDと一致する場合
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
          name: parentArea.name, // 保管場所名
          detail: foundLocation.name === parentArea.name ? '' : foundLocation.name // 詳細名 (保管場所自体なら空)
        });
        setIsFormDialogOpen(true);
      } else {
        console.log(`No matching location found for ID: ${locationId}`);
        setIsFormDialogOpen(false);
        setSelectedLocationForForm(null);
      }
    }
    if (isMobile || isTablet) { // モバイルまたはタブレットの場合、選択後にドロワーを閉じる
      setMobileOpen(false);
    }
  };

  // Called when an area is clicked inside the InteractiveMap
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

      // クリックされたのが保管場所自体で、かつマップ表示可能な場合
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
        // 詳細なロケーションがクリックされた場合、またはマップ表示不可能な保管場所がクリックされた場合
        // マップ表示は維持し、フォームダイアログを開く
        setSelectedLocationForForm({
          id: areaId,
          name: parentArea.name,
          detail: foundLocation.name === parentArea.name ? '' : foundLocation.name
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

  // カテゴリのアコーディオン展開状態を切り替えるハンドラ
  const handleCategoryChange = (category) => (event, isExpanded) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: isExpanded,
    }));
  };

  // 保管場所のアコーディオン展開状態を切り替えるハンドラ
  const handleStorageAreaChange = (areaId) => (event, isExpanded) => {
    setExpandedStorageAreas((prev) => ({
      ...prev,
      [areaId]: isExpanded,
    }));
  };

  const currentDrawerWidth = isMobile ? mobileDrawerWidth : drawerWidth;

  // AppBar の高さとページ名表示領域の高さを計算
  const appBarHeight = theme.mixins.toolbar.minHeight; // AppBar の高さ
  const pageTitleBoxHeight = 57; // App.jsx で設定したページ名表示領域の高さ (p: 1.5 と Typography h6 から概算)
  const totalFixedHeaderHeight = `calc(${appBarHeight}px + ${pageTitleBoxHeight}px)`;

  return (
    <Box sx={{ display: 'flex' }}>
      {isDesktop ? (
        // PC用レイアウト
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
                mt: totalFixedHeaderHeight, // AppBar とページタイトル表示領域の合計高さ分だけ下にずらす
                height: `calc(100vh - ${totalFixedHeaderHeight})`, // Drawer の紙の高さも調整
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
              {loading && <CircularProgress sx={{ m: 'auto' }} />}
              {error && <Alert severity="error" sx={{ m: 1 }}>{error}</Alert>}
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
                          <ListItemText primary={area.name} />
                        </ListItemButton>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </div>
            </Box>
          </Drawer>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              bgcolor: 'background.default',
              // p: 3, // パディングを削除
              mt: totalFixedHeaderHeight,
              height: `calc(100vh - ${totalFixedHeaderHeight})`,
              boxSizing: 'border-box',
              overflow: 'hidden', // スクロールバーを非表示にする
            }}
          >
            {selectedLocation ? (
              <InteractiveMap
                key={selectedLocation.svgPath}
                svgPath={selectedLocation.svgPath}
                onAreaClick={handleAreaClickOnMap}
              />
            ) : (
              <Typography sx={{ p: 3 }}>左のリストから保管場所を選択してください。</Typography> // Typographyにはパディングを残す
            )}
          </Box>
        </>
      ) : (
        // タブレット・スマホ用レイアウト
        <>
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            position: 'absolute',
            top: totalFixedHeaderHeight,
            bottom: '56px', // Space for the footer
            left: 0,
            right: 0,
          }}>
            
            {selectedCategory && (
              <Box sx={{ p: 2, flexShrink: 0, bgcolor: 'background.paper', zIndex: 1, boxShadow: 1 }}>
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
                        handleStorageLocationSelect(selectedArea.name, selectedArea.id); // selectedArea.id を追加
                      } else {
                        setSelectedLocation(null);
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
                          {area.name}
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
                p: 2,
                overflowY: 'auto',
                minHeight: 0
              }}
            >
              {loading && <CircularProgress sx={{ m: 'auto' }} />}
              {error && <Alert severity="error" sx={{ m: 1 }}>{error}</Alert>}
              {selectedLocation ? (
                <InteractiveMap
                  key={selectedLocation.svgPath}
                  svgPath={selectedLocation.svgPath}
                  onAreaClick={handleAreaClickOnMap}
                />
              ) : (
                <Typography>
                  {selectedCategory ? '保管場所を選択してください。' : 'まず、下のボタンからロケーションを選択してください。'}
                </Typography>
              )}
            </Box>
          </Box>

          <AppBar position="fixed" color="primary" sx={{ top: 'auto', bottom: 0 }}>
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-around', overflowX: 'auto' }}>
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
                    borderBottom: selectedCategory === group.category ? '2px solid white' : 'none'
                  }}
                >
                  {group.category}
                </Button>
              ))}
            </Toolbar>
          </AppBar>
        </>
      )}

      {/* InventoryFormDialog をレンダリング */}
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
        />
      )}
    </Box>
  );
}

export default LocationPage;