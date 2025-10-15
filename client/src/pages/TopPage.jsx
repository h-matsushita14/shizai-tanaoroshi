import { useNavigate } from 'react-router-dom';
import { Stack, Card, CardActionArea, Typography, Box, useMediaQuery, useTheme, Grid } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';

function TopPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // スマホ (sm 未満)
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // タブレット (sm 以上 md 未満)
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // PC (md 以上)

  const menuItems = [
    {
      title: '棚卸作業',
      description: 'ロケーションを選択し、資材の棚卸を開始します。',
      icon: <InventoryIcon sx={{ fontSize: isMobile ? 40 : (isTablet ? 50 : 70) }} color="primary" />,
      path: '/locations',
    },
    {
      title: '棚卸記録出力',
      description: '過去の棚卸記録を出力します。',
      icon: <AssessmentIcon sx={{ fontSize: isMobile ? 40 : (isTablet ? 50 : 70) }} color="secondary" />,
      path: '/inventory-report', // 変更
    },
    {
      title: 'マスター登録・編集',
      description: '資材やロケーションのマスターデータを登録・編集します。',
      icon: <SettingsIcon sx={{ fontSize: isMobile ? 40 : (isTablet ? 50 : 70) }} color="info" />,
      path: '/master',
    },
  ];

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 2, sm: 3, md: 4 } }}>
      <Grid
        container
        spacing={{ xs: 2, sm: 3, md: 4 }}
        justifyContent="center"
        sx={{
          width: '100%',
          // maxWidth を削除
          margin: '0 auto',
          // px を削除し、Card の padding で調整
        }}
      >
        {menuItems.map((item, index) => (
          <Grid item xs={12} sm={12} md={12} key={index} sx={{ minWidth: { xs: 280, sm: 320, md: 'auto' } }}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: 'lg', // Container の maxWidth に合わせる
                minWidth: { xs: 280, sm: 320, md: 400 },
                boxShadow: 3,
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                },
              }}
            >
              <CardActionArea
                onClick={() => handleCardClick(item.path)}
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: { xs: 2, sm: 3 },
                }}
              >
                {/* アイコン */}
                <Box sx={{ mb: { xs: 1, sm: 2 } }}>
                  {item.icon}
                </Box>

                {/* ラベル (h5) */}
                <Typography
                  variant={isMobile ? "h6" : (isTablet ? "h5" : "h4")} // フォントサイズを調整
                  component="div"
                  noWrap
                  textAlign="center"
                  sx={{ mb: { xs: 0.5, sm: 1 } }}
                >
                  {item.title}
                </Typography>

                {/* テキスト (body1) */}
                <Typography
                  variant={isMobile ? "body2" : (isTablet ? "body1" : "h6")} // フォントサイズを調整
                  color="text.secondary"
                  textAlign="center"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                >
                  {item.description}
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default TopPage;