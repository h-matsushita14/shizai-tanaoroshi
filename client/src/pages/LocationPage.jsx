import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Accordion, AccordionSummary, AccordionDetails,
  List, ListItemButton, ListItemText, CircularProgress, Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
// ★ 後でGASのウェブアプリURLに置き換えてください ★
const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL;
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

function LocationPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      if (GAS_WEB_APP_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
        setError('GASのウェブアプリURLが設定されていません。');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${GAS_WEB_APP_URL}?action=getLocations`);
        const result = await response.json();

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

  const handleLocationClick = (locationName) => {
    alert(`${locationName} が選択されました。（次の画面は未実装です）`);
  };

  return (
    <Box>
        <Typography variant="h5" component="h1" gutterBottom>
          ロケーション選択
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && (
          locations.map((group, index) => (
            <Accordion key={index} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{group.category}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List component="nav" disablePadding>
                  {group.locations.map((location, locIndex) => (
                    <ListItemButton key={locIndex} onClick={() => handleLocationClick(location)}>
                      <ListItemText primary={location} />
                    </ListItemButton>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>
  );
}

export default LocationPage;
