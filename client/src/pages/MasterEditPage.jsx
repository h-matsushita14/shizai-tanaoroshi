import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack, Card, CardActionArea, Typography, Box } from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';

function MasterEditPage() {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: '商品マスター',
      description: '商品の情報を登録・編集します。',
      icon: <CategoryIcon sx={{ fontSize: 70 }} color="primary" />,
      path: '/master/products',
    },
    {
      title: '仕入先マスター',
      description: '仕入先の情報を登録・編集します。',
      icon: <PeopleIcon sx={{ fontSize: 70 }} color="secondary" />,
      path: '/master/suppliers',
    },
    {
      title: 'ロケーションマスター',
      description: 'ロケーションの情報を登録・編集します。',
      icon: <LocationOnIcon sx={{ fontSize: 70 }} color="info" />,
      path: '/master/locations',
    },
  ];

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <Stack spacing={4} sx={{ width: '100%', maxWidth: 700, margin: '0 auto' }}>
        {menuItems.map((item, index) => (
          <Card key={index}>
            <CardActionArea 
              onClick={() => handleCardClick(item.path)}
              sx={{ display: 'flex', p: 3, alignItems: 'stretch', minHeight: 120 }} 
            >
              
              {/* アイコンBOX */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flex: 1, 
                  mr: 2,
                }}
              >
                {item.icon}
              </Box>

              {/* テキストBOX */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  flex: 2, 
                  justifyContent: 'center', 
                }}
              >
                {/* ラベル (h5) */}
                <Typography 
                  variant="h5" 
                  component="div"
                  sx={{ flex: 1, display: 'flex', alignItems: 'flex-end' }} 
                >
                  {item.title}
                </Typography>
                
                {/* テキスト (body1) */}
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ flex: 1, display: 'flex', alignItems: 'flex-start' }} 
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

export default MasterEditPage;