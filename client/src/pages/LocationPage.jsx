import React, { useState, useEffect } from 'react';
import {
  Typography, Box, List, ListItemButton, ListItemText, CircularProgress,
  Alert, Drawer, Divider, Toolbar,
  Accordion, AccordionSummary, AccordionDetails,
  useMediaQuery, useTheme, FormControl, InputLabel, Select, MenuItem // 新しくインポート
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InteractiveMap from '../components/InteractiveMap';

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
    setSelectedStorageArea('');
    setSelectedLocation(null);
  }, [selectedCategory]);

  useEffect(() => {
    if (!loading && !error) {
      console.log("Fetched data structure:", locations);
    }
  }, [loading, error, locations]);

  // Called when a storage location (e.g., "資材室") is clicked in the accordion
  const handleStorageLocationSelect = (storageName) => {
    const availableMaps = ['出荷準備室', '資材室', '段ボール倉庫', '発送室', '包装室', '第二加工室'];
    if (availableMaps.includes(storageName)) {
      setSelectedLocation({
        name: storageName,
        svgPath: `/floor-plans/${storageName}.svg`
      });
    } else {
      alert(`${storageName} の見取り図はまだありません。`);
      setSelectedLocation(null);
    }
    if (isMobile || isTablet) { // モバイルまたはタブレットの場合、選択後にドロワーを閉じる
      setMobileOpen(false);
    }
  };

  // Called when an area is clicked inside the InteractiveMap
  const handleAreaClickOnMap = (areaId) => {
    // alert(`選択されたエリアのID: ${areaId}`); // デバッグ用のアラートは削除またはコメントアウト

    // locationsデータからareaIdに対応するロケーションを検索
    let foundLocation = null;
    for (const group of locations) {
      for (const area of group.storageAreas) {
        // area.idがL0001やL0029のような大カテゴリのIDと一致する場合
        if (area.id === areaId) {
          foundLocation = {
            name: area.name,
            svgPath: `/floor-plans/${area.name}.svg`
          };
          break;
        }
        // area.details内の詳細ロケーションも検索
        for (const detail of area.details) {
          if (detail.id === areaId) {
            foundLocation = {
              name: detail.name,
              // 詳細ロケーションの場合、親のstorageAreaのSVGパスを使用
              svgPath: `/floor-plans/${area.name}.svg`
            };
            break;
          }
        }
      }
      if (foundLocation) break;
    }

    if (foundLocation) {
      setSelectedLocation(foundLocation);
    } else {
      alert(`ロケーションID ${areaId} に対応するマップが見つかりませんでした。`);
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
                        <Accordion
                          key={area.id}
                          expanded={expandedStorageAreas[area.id] || false}
                          onChange={handleStorageAreaChange(area.id)}
                          sx={{ boxShadow: 'none', '&:before': { display: 'none' }, pl: 2 }}
                        >
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls={`${area.id}-content`}
                            id={`${area.id}-header`}
                            onClick={() => handleStorageLocationSelect(area.name)}
                          >
                            <Typography>{area.name}</Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ p: 0 }}>
                            <List component="div" disablePadding>
                              {area.details.map((detail) => (
                                <ListItemButton
                                  key={detail.id}
                                  onClick={() => alert(`選択されたエリア: ${detail.name} (ID: ${detail.id})`)}
                                  sx={{ pl: 4 }}
                                >
                                  <ListItemText primary={detail.name} />
                                </ListItemButton>
                              ))}
                            </List>
                          </AccordionDetails>
                        </Accordion>
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
              p: 3,
              ml: `${drawerWidth}px`,
              width: `calc(100% - ${drawerWidth}px)`,
              mt: totalFixedHeaderHeight, // メインコンテンツも固定ヘッダーの下に配置
            }}
          >
            <Toolbar />
            <Typography variant="h6" noWrap component="div" sx={{ mb: 2 }}>
              {selectedLocation ? selectedLocation.name : 'ロケーションを選択'}
            </Typography>
            {selectedLocation ? (
              <InteractiveMap
                key={selectedLocation.svgPath}
                svgPath={selectedLocation.svgPath}
                onAreaClick={handleAreaClickOnMap}
              />
            ) : (
              <Typography>左のリストから保管場所を選択してください。</Typography>
            )}
          </Box>
        </>
      ) : (
        // タブレット・スマホ用レイアウト
        <Box sx={{ flexGrow: 1, mt: totalFixedHeaderHeight }}> {/* メインコンテンツも固定ヘッダーの下に配置 */}
          <Toolbar /> {/* AppBar の高さ分のスペースを確保 */}
          <Box sx={{ p: 2, display: 'flex', gap: 2, flexDirection: 'column' }}>
            {/* ロケーション選択プルダウン */}
            <FormControl fullWidth>
              <InputLabel id="category-select-label">ロケーション</InputLabel>
              <Select
                labelId="category-select-label"
                id="category-select"
                value={selectedCategory}
                label="ロケーション"
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedStorageArea(''); // カテゴリ変更で保管場所をリセット
                  setSelectedLocation(null); // マップもリセット
                }}
              >
                <MenuItem value="">
                  <em>選択してください</em>
                </MenuItem>
                {locations.map((group) => (
                  <MenuItem key={group.category} value={group.category}>
                    {group.category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 保管場所選択プルダウン */}
            <FormControl fullWidth disabled={!selectedCategory}>
              <InputLabel id="storage-area-select-label">保管場所</InputLabel>
              <Select
                labelId="storage-area-select-label"
                id="storage-area-select"
                value={selectedStorageArea}
                label="保管場所"
                onChange={(e) => {
                  setSelectedStorageArea(e.target.value);
                  // 選択された保管場所に基づいてマップを表示
                  const selectedArea = locations
                    .find(group => group.category === selectedCategory)?.storageAreas
                    .find(area => area.name === e.target.value);
                  if (selectedArea) {
                    setSelectedLocation({
                      name: selectedArea.name,
                      svgPath: `/floor-plans/${selectedArea.name}.svg`
                    });
                  } else {
                    setSelectedLocation(null);
                  }
                }}
              >
                <MenuItem value="">
                  <em>選択してください</em>
                </MenuItem>
                {selectedCategory && locations
                  .find(group => group.category === selectedCategory)?.storageAreas
                  .map((area) => (
                    <MenuItem key={area.id} value={area.name}>
                      {area.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>

          {/* メインコンテンツ (マップ表示) */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              bgcolor: 'background.default',
              p: 3,
            }}
          >
            {loading && <CircularProgress sx={{ m: 'auto' }} />}
            {error && <Alert severity="error" sx={{ m: 1 }}>{error}</Alert>}
            <Typography variant="h6" noWrap component="div" sx={{ mb: 2 }}>
              {selectedLocation ? selectedLocation.name : 'ロケーションを選択'}
            </Typography>
            {selectedLocation ? (
              <InteractiveMap
                key={selectedLocation.svgPath}
                svgPath={selectedLocation.svgPath}
                onAreaClick={handleAreaClickOnMap}
              />
            ) : (
              <Typography>ロケーションと保管場所を選択してください。</Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default LocationPage;
