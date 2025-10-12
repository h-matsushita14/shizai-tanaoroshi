import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, CircularProgress, Alert,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, TableSortLabel, Grid, FormControl, InputLabel, Select, MenuItem, useTheme, useMediaQuery, Card, CardContent, CardActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationProductRegistrationDialog from '../components/LocationProductRegistrationDialog'; // 追加

const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL;

const LocationCard = ({ location, handleEditClick, handleProductRegistrationClick }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flexGrow: 1 }}>
      <Typography variant="h6" component="div">
        {location["ロケーション"]}
      </Typography>
      <Typography color="text.secondary">
        ID: {location["ロケーションID"]}
      </Typography>
      <Typography color="text.secondary">
        保管場所: {location["保管場所"]}
      </Typography>
      <Typography color="text.secondary">
        詳細①: {location["詳細①"]}
      </Typography>
    </CardContent>
    <CardActions>
      <Button size="small" onClick={() => handleProductRegistrationClick(location)}>商品登録</Button>
      <Button size="small" onClick={() => handleEditClick(location)}>編集</Button>
    </CardActions>
  </Card>
);

function LocationMasterPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({});
  const [locationFilter, setLocationFilter] = useState('');
  const [storageAreaFilter, setStorageAreaFilter] = useState('');
  const [detailFilter, setDetailFilter] = useState('');
  const [orderBy, setOrderBy] = useState('ロケーションID');
  const [order, setOrder] = useState('asc');
  const [isProductRegistrationDialogOpen, setIsProductRegistrationDialogOpen] = useState(false);
  const [selectedLocationForProductRegistration, setSelectedLocationForProductRegistration] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${GAS_WEB_APP_URL}?action=getLocationsMaster`); // 新しいGASアクションを想定
      const result = await response.json();
      if (result.status === 'success') {
        const locationsWithId = result.data.map((loc, index) => ({
          id: loc["ロケーションID"] || index,
          ...loc,
        }));
        setLocations(locationsWithId);
      } else {
        throw new Error(result.message || 'ロケーションデータの取得に失敗しました。');
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = locations.filter(loc =>
    (locationFilter ? loc["ロケーション"] === locationFilter : true) &&
    (storageAreaFilter ? loc["保管場所"] === storageAreaFilter : true) &&
    (detailFilter ? loc["詳細①"] === detailFilter : true)
  );

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedLocations = [...filteredLocations].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    }
    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const handleAddClick = () => {
    setEditingLocation(null);
    setFormData({});
    setOpenDialog(true);
  };

  const handleEditClick = (location) => {
    setEditingLocation(location);
    setFormData(location);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingLocation(null);
    setFormData({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const action = editingLocation ? 'editLocation' : 'addLocation';
      const response = await fetch(`${GAS_WEB_APP_URL}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.status === 'success') {
        alert(result.message);
        fetchLocations();
        handleDialogClose();
      } else {
        throw new Error(result.message || 'ロケーションの保存に失敗しました。');
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to save location:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async () => {
    if (!editingLocation || !editingLocation["ロケーションID"]) {
      setError('削除するロケーションが特定できません。');
      return;
    }
    if (window.confirm(`ロケーションID: ${editingLocation["ロケーションID"]} のロケーションを削除してもよろしいですか？`)) {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${GAS_WEB_APP_URL}?action=deleteLocation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locationId: editingLocation["ロケーションID"] }),
        });
        const result = await response.json();
        if (result.status === 'success') {
          alert(result.message);
          fetchLocations();
          handleDialogClose();
        } else {
          throw new Error(result.message || 'ロケーションの削除に失敗しました。');
        }
      } catch (err) {
        setError(err.message);
        console.error('Failed to delete location:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProductRegistrationClick = (location) => {
    console.log('商品登録ボタンがクリックされました:', location);
    setSelectedLocationForProductRegistration(location);
    setIsProductRegistrationDialogOpen(true);
    console.log('selectedLocationForProductRegistration after click:', location);
    console.log('isProductRegistrationDialogOpen after click:', true);
  };

  const handleProductRegistrationDialogClose = () => {
    setIsProductRegistrationDialogOpen(false);
    setSelectedLocationForProductRegistration(null);
  };

  const columns = [
    { field: 'ロケーションID', headerName: 'ロケーションID', width: 150 },
    { field: 'ロケーション', headerName: 'ロケーション', width: 150 },
    { field: '保管場所', headerName: '保管場所', width: 150 },
    { field: '詳細①', headerName: '詳細①', width: 150 },
    { field: '備考', headerName: '備考', width: 200 },
    {
      field: 'productRegistration',
      headerName: '商品登録',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleProductRegistrationClick(params.row)}
        >
          商品登録
        </Button>
      ),
    },
    {
      field: 'actions',
      headerName: '操作',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <IconButton color="primary" onClick={() => handleEditClick(params.row)}>
          <EditIcon />
        </IconButton>
      ),
    },
  ];

  const locationOptions = [...new Set(locations.map(loc => loc['ロケーション']))];
  const storageAreaOptions = [...new Set(locations.map(loc => loc['保管場所']))];
  const detailOptions = [...new Set(locations.map(loc => loc['詳細①']))];

  return (
    <Box sx={{ p: 3, overflowX: 'hidden' }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>ロケーション</InputLabel>
          <Select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            label="ロケーション"
          >
            <MenuItem value="">
              <em>全て</em>
            </MenuItem>
            {locationOptions.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>保管場所</InputLabel>
          <Select
            value={storageAreaFilter}
            onChange={(e) => setStorageAreaFilter(e.target.value)}
            label="保管場所"
          >
            <MenuItem value="">
              <em>全て</em>
            </MenuItem>
            {storageAreaOptions.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>詳細①</InputLabel>
          <Select
            value={detailFilter}
            onChange={(e) => setDetailFilter(e.target.value)}
            label="詳細①"
          >
            <MenuItem value="">
              <em>全て</em>
            </MenuItem>
            {detailOptions.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          sx={{ ml: 'auto' }}
        >
          {!isMobile && "新規ロケーション追加"}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>ロケーションデータを読み込み中...</Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ m: 1 }}>{error}</Alert>
      ) : isMobile ? (
        <Grid container spacing={2}>
          {sortedLocations.map((location) => (
            <Grid item xs={12} sm={12} md={4} key={location.id}>
              <LocationCard
                location={location}
                handleEditClick={handleEditClick}
                handleProductRegistrationClick={handleProductRegistrationClick}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
          <Table stickyHeader aria-label="ロケーションマスターテーブル">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.field}
                    sortDirection={orderBy === column.field ? order : false}
                    style={{ minWidth: column.width }}
                  >
                    {column.headerName !== '操作' ? (
                      <TableSortLabel
                        active={orderBy === column.field}
                        direction={orderBy === column.field ? order : 'asc'}
                        onClick={() => handleRequestSort(column.field)}
                      >
                        {column.headerName}
                      </TableSortLabel>
                    ) : (
                      column.headerName
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedLocations.map((location) => (
                <TableRow hover key={location.id}>
                  {columns.map((column) => (
                    <TableCell key={`${location.id}-${column.field}`}>
                      {column.renderCell ? column.renderCell({ row: location }) : location[column.field]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {editingLocation ? 'ロケーションを編集' : '新規ロケーション追加'}
          </Typography>
          {editingLocation && (
            <IconButton
              color="error"
              onClick={handleDeleteLocation}
              sx={{ ml: 2 }}
            >
              <DeleteIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            {/* ロケーションIDは編集不可 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ロケーションID"
                name="ロケーションID"
                value={formData["ロケーションID"] || ''}
                onChange={handleChange}
                disabled={!!editingLocation} // 編集時はID変更不可
                margin="dense"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ロケーション"
                name="ロケーション"
                value={formData["ロケーション"] || ''}
                onChange={handleChange}
                margin="dense"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="保管場所"
                name="保管場所"
                value={formData["保管場所"] || ''}
                onChange={handleChange}
                margin="dense"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="詳細①"
                name="詳細①"
                value={formData["詳細①"] || ''}
                onChange={handleChange}
                margin="dense"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="備考"
                name="備考"
                value={formData["備考"] || ''}
                onChange={handleChange}
                margin="dense"
                variant="outlined"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="inherit">
            キャンセル
          </Button>
          <Button onClick={handleSaveLocation} color="primary" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : (editingLocation ? '更新' : '追加')}
          </Button>
        </DialogActions>
      </Dialog>

      <LocationProductRegistrationDialog
        open={isProductRegistrationDialogOpen}
        onClose={handleProductRegistrationDialogClose}
        locationId={selectedLocationForProductRegistration?.['ロケーションID']}
        locationName={selectedLocationForProductRegistration?.['ロケーション']}
        onProductListUpdated={() => fetchLocations()} // ダミー関数を渡す
      />
    </Box>
  );
}

export default LocationMasterPage;