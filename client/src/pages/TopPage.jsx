import { useNavigate } from 'react-router-dom';
import { Stack, Card, CardActionArea, Typography, Box } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';

// ... (menuItems, handleCardClick の定義は省略。変更なし) ...

function TopPage() {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: '棚卸作業',
      description: 'ロケーションを選択し、資材の棚卸を開始します。',
      icon: <InventoryIcon sx={{ fontSize: 70 }} color="primary" />,
      path: '/locations',
    },
    {
      title: '棚卸記録出力',
      description: '過去の棚卸記録をCSV形式で出力します。',
      icon: <AssessmentIcon sx={{ fontSize: 70 }} color="secondary" />,
      path: '/export', // 未実装
    },
    {
      title: 'マスター登録・編集',
      description: '資材やロケーションのマスターデータを登録・編集します。',
      icon: <SettingsIcon sx={{ fontSize: 70 }} color="info" />,
      path: '/master',
    },
  ];

  const handleCardClick = (path) => {
    if (path === '/export') {
      alert('この機能は現在実装中です。');
    } else {
      navigate(path);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <Stack spacing={4} sx={{ width: '100%', maxWidth: 700, margin: '0 auto' }}>
        {menuItems.map((item, index) => (
          <Card key={index}>
            <CardActionArea 
              onClick={() => handleCardClick(item.path)}
              // 変更点1: カード内の高さを確保するため、最小高さを設定 (例: 120px)
              //        また、子要素を垂直方向に引き伸ばすため alignItems: 'stretch' に変更
              sx={{ display: 'flex', p: 3, alignItems: 'stretch', minHeight: 120 }} 
            >
              
              {/* アイコンBOX */}
              <Box 
                // 変更点2: width: 100 を削除し、flex: 1 を設定。左右の幅を 1/3 確保
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flex: 1, // 幅の比率を 1 に設定 (全体 3 のうち 1)
                  mr: 2,
                  // 補足: height: '100%' は alignItems: 'stretch' のおかげで効いています
                }}
              >
                {item.icon}
              </Box>

              {/* テキストBOX */}
              <Box 
                // 変更点3: flex: 2 を設定。左右の幅を 2/3 確保
                // 変更点4: 内部を Flexbox (縦方向) に設定し、高さを 100% 使用する
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  flex: 2, // 幅の比率を 2 に設定 (全体 3 のうち 2)
                  justifyContent: 'center', // 垂直方向のコンテンツ中央揃えを維持
                }}
              >
                {/* ラベル (h5) */}
                <Typography 
                  variant="h5" 
                  component="div"
                  // 変更点5: flex: 1 を設定。高さの比率を 1/2 確保
                  sx={{ flex: 1, display: 'flex', alignItems: 'flex-end' }} // テキストを下端に揃える
                >
                  {item.title}
                </Typography>
                
                {/* テキスト (body1) */}
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  // 変更点6: flex: 1 を設定。高さの比率を 1/2 確保
                  sx={{ flex: 1, display: 'flex', alignItems: 'flex-start' }} // テキストを上端に揃える
                >
                  {item.description}
                </Typography>
              </Box>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}

export default TopPage;
