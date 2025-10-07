import React, { useState, useEffect } from 'react';
import {
  Typography, Box, List, ListItemButton, ListItemText, CircularProgress,
  Alert, Drawer, AppBar, Toolbar, CssBaseline, Divider,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InteractiveMap from '../components/InteractiveMap';

const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL;
const drawerWidth = 240;

function LocationPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null); // For the map display

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

  // Called when a storage location (e.g., "資材室") is clicked in the accordion
  const handleStorageLocationSelect = (storageName) => {
    const availableMaps = ['出荷準備室', '資材室', '段ボール倉庫', '発送室', '包装室'];
    if (availableMaps.includes(storageName)) {
      setSelectedLocation({
        name: storageName,
        svgPath: `/floor-plans/${storageName}.svg`
      });
    } else {
      alert(`${storageName} の見取り図はまだありません。`);
      setSelectedLocation(null);
    }
  };

  // Called when an area is clicked inside the InteractiveMap
  const handleAreaClickOnMap = (areaId) => {
    alert(`選択されたエリアのID: ${areaId}`);
    // TODO: Fetch products for this areaId
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            {selectedLocation ? `${selectedLocation.name} 見取り図` : 'ロケーションを選択'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar />
        <Divider />
        <Typography variant="h6" sx={{ p: 2 }}>
          ロケーション一覧
        </Typography>
        {loading && <CircularProgress sx={{ m: 'auto' }} />}
        {error && <Alert severity="error" sx={{ m: 1 }}>{error}</Alert>}
        {!loading && !error && (
          <div>
            {locations.map((group) => (
              <Accordion key={group.category} sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`${group.category}-content`}
                  id={`${group.category}-header`}
                >
                  <Typography>{group.category}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  {group.storageAreas.map((area) => (
                    <Accordion key={area.id} sx={{ boxShadow: 'none', '&:before': { display: 'none' }, pl: 2 }}>
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
        )}
      </Drawer>
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
      >
        <Toolbar />
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
    </Box>
  );
}

export default LocationPage;