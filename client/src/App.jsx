// Netlifyデプロイテスト用のコメント
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
import { MasterDataProvider, useMasterData } from './contexts/MasterDataContext'; // MasterDataProvider と useMasterData をインポート

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

function AppContent() {
  const [appReady, setAppReady] = useState(false); // アプリケーションの準備完了状態
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('md')); // md以下の画面サイズでtrue
  const { isLoadingMasterData, masterDataError } = useMasterData(); // マスターデータのロード状態を取得

  // 現在のパスに対応するページ名を取得
  const currentPageTitle = pageTitles[location.pathname] || '資材棚卸システム'; // デフォルトタイトル

  // AppBar の高さとページ名表示領域の高さを計算
  const appBarHeight = theme.mixins.toolbar.minHeight; // AppBar の高さ
  const pageTitleBoxHeight = 57; // ページ名表示領域の Box の高さ (p: 1.5 と Typography h6 から概算)

  // スプラッシュスクリーンとデータロードの完了を待つ
  if (!appReady || isLoadingMasterData) {
    return <SplashVideo onVideoEnd={() => setAppReady(true)} />;
  }

  if (masterDataError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert severity="error">マスターデータのロード中にエラーが発生しました: {masterDataError}</Alert>
      </Box>
    );
  }

  return (
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
  );
}

function App() {
  return (
    <MasterDataProvider>
      <AppContent />
    </MasterDataProvider>
  );
}

export default App;