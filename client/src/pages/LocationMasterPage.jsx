import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, CircularProgress, Alert,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, TableSortLabel, Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationProductRegistrationDialog from '../components/LocationProductRegistrationDialog'; // 追加

const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL;

function LocationMasterPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState('ロケーションID');
  const [order, setOrder] = useState('asc');
  const [isProductRegistrationDialogOpen, setIsProductRegistrationDialogOpen] = useState(false);
  const [selectedLocationForProductRegistration, setSelectedLocationForProductRegistration] = useState(null);

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
    loc["ロケーションID"].toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc["ロケーション"].toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc["保管場所"].toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc["詳細①"].toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          label="ロケーションを検索"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: '300px' }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          sx={{ ml: 'auto' }}
        >
          新規ロケーション追加
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>ロケーションデータを読み込み中...</Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ m: 1 }}>{error}</Alert>
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
    </Box>
  );
}

export default LocationMasterPage;