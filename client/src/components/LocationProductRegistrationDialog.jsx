import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Box, CircularProgress, Alert, TextField, List, ListItem, ListItemText,
  ListItemSecondaryAction, IconButton, Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL;

function LocationProductRegistrationDialog({
  open, onClose, locationId, locationName, onProductListUpdated
}) {
  const [allProducts, setAllProducts] = useState([]);
  const [locationProducts, setLocationProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      fetchAllProducts();
      fetchLocationProducts();
    }
  }, [open, locationId]);

  const fetchAllProducts = async () => {
    try {
      const response = await fetch(`${GAS_WEB_APP_URL}?action=getProducts`);
      console.log("fetchAllProducts raw response:", response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log("fetchAllProducts parsed result:", result);
      if (result.status === 'success') {
        setAllProducts(result.data);
      } else {
        throw new Error(result.message || '全商品データの取得に失敗しました。');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching all products:', err);
    }
  };

  const fetchLocationProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${GAS_WEB_APP_URL}?action=getProductsByLocation&locationId=${locationId}`);
      console.log("fetchLocationProducts raw response:", response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log("fetchLocationProducts parsed result:", result);
      if (result.status === 'success') {
        setLocationProducts(result.data);
      } else {
        throw new Error(result.message || 'ロケーション別商品データの取得に失敗しました。');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching location products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProductToLocation = async (productCode) => {
    try {
      const response = await fetch(`${GAS_WEB_APP_URL}?action=addLocationProduct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId, productCode }),
      });
      const result = await response.json();
      if (result.status === 'success') {
        alert(result.message);
        fetchLocationProducts(); // 関連付けられた商品を再取得
        onProductListUpdated(); // 親コンポーネントに更新を通知
      } else {
        throw new Error(result.message || '商品の関連付けに失敗しました。');
      }
    } catch (err) {
      alert('商品の関連付け中にエラーが発生しました。');
      console.error('Error adding product to location:', err);
    }
  };

  const handleDeleteProductFromLocation = async (productCode) => {
    if (window.confirm(`このロケーションから商品コード: ${productCode} を削除してもよろしいですか？`)) {
      try {
        const response = await fetch(`${GAS_WEB_APP_URL}?action=deleteLocationProduct`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locationId, productCode }),
        });
        const result = await response.json();
        if (result.status === 'success') {
          alert(result.message);
          fetchLocationProducts(); // 関連付けられた商品を再取得
          onProductListUpdated(); // 親コンポーネントに更新を通知
        } else {
          throw new Error(result.message || '商品の関連付け解除に失敗しました。');
        }
      } catch (err) {
        alert('商品の関連付け解除中にエラーが発生しました。');
        console.error('Error deleting product from location:', err);
      }
    }
  };

  const availableProducts = allProducts.filter(
    (product) =>
      !locationProducts.some((lp) => lp["商品コード"] === product["商品コード"]) &&
      (product["商品コード"].toLowerCase().includes(searchTerm.toLowerCase()) ||
       product["商品名"].toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          {locationName} ({locationId}) の商品登録
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>登録済み商品</Typography>
              {locationProducts.length === 0 ? (
                <Typography>このロケーションには商品が登録されていません。</Typography>
              ) : (
                <List dense>
                  {locationProducts.map((product) => (
                    <ListItem key={product["商品コード"]}>
                      <ListItemText
                        primary={product["商品名"]}
                        secondary={`商品コード: ${product["商品コード"]}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteProductFromLocation(product["商品コード"])}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>利用可能な商品</Typography>
              <TextField
                fullWidth
                label="商品コードまたは商品名で検索"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
              />
              {availableProducts.length === 0 ? (
                <Typography>利用可能な商品はありません。</Typography>
              ) : (
                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {availableProducts.map((product) => (
                    <ListItem key={product["商品コード"]}>
                      <ListItemText
                        primary={product["商品名"]}
                        secondary={`商品コード: ${product["商品コード"]}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="add" onClick={() => handleAddProductToLocation(product["商品コード"])}>
                          <AddIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}

export default LocationProductRegistrationDialog;
