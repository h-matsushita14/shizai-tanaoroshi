import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';

const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL;

function InventoryFormDialog({ open, onClose, locationId, locationName, locationDetail }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({}); // 商品コードをキーとして数量を保持

  useEffect(() => {
    if (!open || !locationId) {
      setProducts([]);
      setQuantities({});
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const requestUrl = `${GAS_WEB_APP_URL}?action=getProductsByLocation&locationId=${locationId}`;
        const response = await fetch(requestUrl);
        const result = await response.json();

        if (result.status === 'success') {
          setProducts(result.data);
          // 既存の数量を初期値として設定
          const initialQuantities = {};
          result.data.forEach(product => {
            initialQuantities[product["商品コード"]] = ''; // 初期値は空
          });
          setQuantities(initialQuantities);
        } else {
          throw new Error(result.message || '商品データの取得に失敗しました。');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [open, locationId]);

  const handleQuantityChange = (productCode, value) => {
    setQuantities(prev => ({
      ...prev,
      [productCode]: value,
    }));
  };

  const handleSave = () => {
    // ここで棚卸データをGASに送信するロジックを実装
    // 例: doPostで新しいアクション (e.g., 'recordInventory') を呼び出す
    console.log('Saving inventory for location:', locationId, 'Quantities:', quantities);
    alert('棚卸データを保存しました。（実際にはGASに送信します）');
    onClose(); // 保存後にダイアログを閉じる
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        棚卸入力: {locationName} {locationDetail ? `(${locationDetail})` : ''}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : products.length === 0 ? (
          <Typography>このロケーションには商品が登録されていません。</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>商品コード</TableCell>
                  <TableCell>商品名</TableCell>
                  <TableCell align="right">数量</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product["商品コード"]}>
                    <TableCell>{product["商品コード"]}</TableCell>
                    <TableCell>{product["商品名"]}</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={quantities[product["商品コード"]] || ''}
                        onChange={(e) => handleQuantityChange(product["商品コード"], e.target.value)}
                        inputProps={{ min: 0 }}
                        size="small"
                        sx={{ width: '80px' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSave} color="primary" variant="contained" disabled={loading || products.length === 0}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default InventoryFormDialog;