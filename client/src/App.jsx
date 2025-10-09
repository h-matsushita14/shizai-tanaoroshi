import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, IconButton, Box, useTheme } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // ArrowBackIcon を追加
import TopPage from './pages/TopPage';
import LocationPage from './pages/LocationPage';
import MasterEditPage from './pages/MasterEditPage';
import ProductMasterPage from './pages/ProductMasterPage';

// パスとページ名のマッピング
const pageTitles = {
  '/': 'トップページ',
  '/locations': 'ロケーション選択',
  '/master': 'マスター登録・編集',
  '/master/products': '商品マスター',
  // 必要に応じて他のパスも追加
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // 現在のパスに対応するページ名を取得
  const currentPageTitle = pageTitles[location.pathname] || '資材棚卸システム'; // デフォルトタイトル

  // AppBar の高さとページ名表示領域の高さを計算
  const appBarHeight = theme.mixins.toolbar.minHeight; // AppBar の高さ
  const pageTitleBoxHeight = 57; // ページ名表示領域の Box の高さ (p: 1.5, h6, border)

  return (
    <Box sx={{ overflowX: 'hidden' }}>
      <AppBar position="fixed">
        <Toolbar>
          {/* ホームボタン */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="home"
            onClick={(event) => {
              navigate('/');
              event.currentTarget.blur();
            }}
            sx={{ mr: 2 }}
          >
            <HomeIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            資材棚卸システム
          </Typography>
        </Toolbar>
      </AppBar>
      {/* ヘッダーの下に現在のページ名を表示 */}
      <Toolbar /> {/* AppBar の高さ分のスペースを確保 */}
      <Box
        sx={{
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          p: 1.5,
          borderBottom: 1,
          borderColor: theme.palette.primary.dark,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'fixed',
          top: appBarHeight, // AppBar の高さの分だけ下に配置
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar - 1,
        }}
      >
        {/* 戻るボタン */}
        {location.pathname !== '/' && ( // トップページ以外で表示
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
      <Container component="main" maxWidth="lg" sx={{ mt: `calc(${appBarHeight}px + ${pageTitleBoxHeight}px)`, mb: 4 }}>
        <Routes>
          <Route path="/" element={<TopPage />} />
          <Route path="/locations" element={<LocationPage />} />
          <Route path="/master" element={<MasterEditPage />} />
          <Route path="/master/products" element={<ProductMasterPage />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;
