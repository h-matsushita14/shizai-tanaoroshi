import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, IconButton, Box, useTheme, useMediaQuery } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // ArrowBackIcon を追加
import TopPage from './pages/TopPage';
import LocationPage from './pages/LocationPage';
import MasterEditPage from './pages/MasterEditPage';
import ProductMasterPage from './pages/ProductMasterPage';
import SupplierMasterPage from './pages/SupplierMasterPage';
import LocationMasterPage from './pages/LocationMasterPage'; // 追加
import InventoryReportPage from './pages/InventoryReportPage'; // 追加
import SplashVideo from './components/SplashVideo'; // SplashVideo をインポート

// パスとページ名のマッピング
const pageTitles = {
  '/': 'トップページ',
  '/locations': 'ロケーション選択',
  '/master': 'マスター登録・編集',
  '/master/products': '商品マスター',
  '/master/suppliers': '仕入れ先マスター',
  '/master/locations': 'ロケーションマスター', // 追加
  '/inventory-report': '棚卸記録出力', // 追加
  // 必要に応じて他のパスも追加
};

function App() {
  const [showSplash, setShowSplash] = useState(true); // スプラッシュ表示状態
  const [dataLoaded, setDataLoaded] = useState(false); // データロード状態
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('md')); // md以下の画面サイズでtrue

  // 現在のパスに対応するページ名を取得
  const currentPageTitle = pageTitles[location.pathname] || '資材棚卸システム'; // デフォルトタイトル

  // 初期データのフェッチとキャッシュ
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // ここに実際のデータフェッチロジックを記述します。
        // 例: const response = await fetch('/api/initial-data');
        // const data = await response.json();

        // データのシミュレーション
        const mockData = { message: 'Initial data loaded!' };
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒間のロードをシミュレート

        // データをlocalStorageにキャッシュ
        localStorage.setItem('initialAppData', JSON.stringify(mockData));
        console.log('Initial data fetched and cached:', mockData);

        setDataLoaded(true);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        // エラー時でもアプリを続行するためにdataLoadedをtrueにするか、エラーページを表示するか検討
        setDataLoaded(true);
      }
    };

    fetchInitialData();
  }, []);

  // AppBar の高さとページ名表示領域の高さを計算
  const appBarHeight = theme.mixins.toolbar.minHeight; // AppBar の高さ
  const pageTitleBoxHeight = 57; // ページ名表示領域の Box の高さ (p: 1.5 と Typography h6 から概算)

  return (
    <>
      {showSplash && <SplashVideo onVideoEnd={() => setShowSplash(false)} />}
      {!showSplash && dataLoaded && (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX: 'hidden' }}>
          <AppBar position="fixed">
            <Toolbar>
              {/* スマホ・タブレット時の戻るボタン (左端) */}
              {location.pathname !== '/' && isMobileOrTablet && ( 
                <IconButton
                  edge="start" // 左端に配置
                  color="inherit"
                  aria-label="back"
                  onClick={() => navigate(-1)}
                  sx={{ mr: 2 }}
                >
                  <ArrowBackIcon />
                </IconButton>
              )}
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                資材棚卸システム
              </Typography>
              {/* ホームボタン (右端) */}
              <IconButton
                color="inherit"
                aria-label="home"
                onClick={(event) => {
                  navigate('/');
                  event.currentTarget.blur();
                }}
                sx={{ ml: 'auto' }} // 右端に配置
              >
                <HomeIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
          {/* ヘッダーの下に現在のページ名を表示 */}
          <Box
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              p: 1.5,
              borderBottom: 1,
              borderColor: theme.palette.primary.dark,
              display: { xs: 'none', md: 'flex' }, // スマホとタブレットで非表示
              justifyContent: 'center',
              alignItems: 'center',
              position: 'fixed',
              top: appBarHeight, // AppBar の高さの分だけ下に配置
              left: 0,
              right: 0,
              zIndex: theme.zIndex.appBar - 1,
            }}
          >
            {location.pathname !== '/' && !isMobileOrTablet && ( // トップページ以外かつPCでのみ表示
              <IconButton
                color="inherit"
                aria-label="back"
                onClick={() => navigate(-1)}
                sx={{ position: 'absolute', left: 8 }} // 左端に配置
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant="h6" align="center" component="div">
              {currentPageTitle}
            </Typography>
          </Box>
          <Container
            component="main"
            maxWidth="lg"
            sx={{
              paddingTop: isMobileOrTablet ? '56px' : 'calc(64px + 57px)',
              flexGrow: 1, // 残りのスペースを埋める
              display: 'flex', // コンテンツを配置するためにflexboxを使用
              justifyContent: 'center', // 水平方向中央
            }}
          >
            <Routes>
              <Route path="/" element={<TopPage />} />
              <Route path="/locations" element={<LocationPage />} />
              <Route path="/master" element={<MasterEditPage />} />
              <Route path="/master/products" element={<ProductMasterPage />} />
              <Route path="/master/suppliers" element={<SupplierMasterPage />} />
              <Route path="/master/locations" element={<LocationMasterPage />} />
              <Route path="/inventory-report" element={<InventoryReportPage />} /> {/* 追加 */}
            </Routes>
          </Container>
        </Box>
      )}
    </>
  );
}

export default App;