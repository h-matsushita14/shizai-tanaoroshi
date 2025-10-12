import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  useMediaQuery, useTheme, List, ListItem, ListItemText // useMediaQuery, useTheme, List, ListItem, ListItemText を追加
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add'; // AddIcon をインポート
import LocationProductRegistrationDialog from './LocationProductRegistrationDialog'; // 商品登録ダイアログをインポート

const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL;

function InventoryFormDialog({ open, onClose, locationId, locationName, locationDetail }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({}); // 商品コードをキーとして { lot: '', loose: '' } を保持
  const [isProductRegistrationDialogOpen, setIsProductRegistrationDialogOpen] = useState(false); // 商品登録ダイアログの開閉状態

  const theme = useTheme(); // useTheme を追加
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('md')); // md以下の画面サイズでtrue

  useEffect(() => {
    if (!open || !locationId) {
      setProducts([]);
      setQuantities({});
      return;
    }

    fetchProducts();
  }, [open, locationId]);

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
          initialQuantities[product["商品コード"]] = { lot: '', loose: '' }; // 初期値は空
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

  const handleQuantityChange = (productCode, type, value) => {
    setQuantities(prev => ({
      ...prev,
      [productCode]: {
        ...prev[productCode],
        [type]: value,
      },
    }));
  };

  const handleSave = async () => {
    const inventoryData = [];
    products.forEach(product => {
      const productCode = product["商品コード"];
      const lotQuantity = quantities[productCode]?.lot;
      const looseQuantity = quantities[productCode]?.loose;

      // ロット数量またはバラ数量のいずれかが入力されている場合のみ記録対象とする
      if (lotQuantity !== '' || looseQuantity !== '') {
        inventoryData.push({
          商品コード: productCode,
          ロケーションID: locationId,
          ロット数量: lotQuantity !== '' ? parseInt(lotQuantity, 10) : 0,
          ロット単位: product["ロット単位"] || '',
          バラ数量: looseQuantity !== '' ? parseInt(looseQuantity, 10) : 0,
          バラ単位: product["バラ単位"] || '',
          記録時単価: product["単価"] || 0, // Product_Masterの単価を使用
          担当者: '未設定', // TODO: 担当者入力フィールドを追加
          備考: '', // TODO: 備考入力フィールドを追加
        });
      }
    });

    if (inventoryData.length === 0) {
      alert('入力された棚卸データがありません。');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${GAS_WEB_APP_URL}?action=recordInventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: inventoryData }),
      });
      const result = await response.json();

      if (result.status === 'success') {
        alert('棚卸データを正常に保存しました。');
        onClose(); // 保存後にダイアログを閉じる
      } else {
        throw new Error(result.message || '棚卸データの保存に失敗しました。');
      }
    } catch (err) {
      setError(err.message);
      alert(`棚卸データの保存中にエラーが発生しました: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProductRegistrationDialog = () => {
    setIsProductRegistrationDialogOpen(true);
  };

  const handleCloseProductRegistrationDialog = () => {
    setIsProductRegistrationDialogOpen(false);
    fetchProducts(); // 商品登録後に商品リストを再フェッチ
  };

  const formatUnit = (unit) => {
    if (!unit) return '';
    const parts = unit.split('/');
    return parts[0];
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          棚卸入力: {locationName} {locationDetail ? `(${locationDetail})` : ''}
        </Typography>
        <IconButton
          color="primary"
          aria-label="商品登録"
          onClick={handleOpenProductRegistrationDialog}
        >
          <AddIcon />
        </IconButton>
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
          isMobileOrTablet ? (
            <List>
              {products.map((product) => (
                <ListItem key={product["商品コード"]} divider>
                  <ListItemText
                    primary={
                      <Box>
                        <Typography variant="body2" color="textSecondary" component="span">商品コード:</Typography>
                        <Typography variant="subtitle1" component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
                          {product["商品コード"]}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" component="span">商品名:</Typography>
                        <Typography variant="subtitle1" component="span" sx={{ fontWeight: 'bold' }}>
                          {product["商品名"]}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" color="textSecondary" component="span">社内名称:</Typography>
                          <Typography variant="body1" component="span">
                            {product["社内名称"] || '-'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Typography variant="body2" color="textSecondary" sx={{ mr: 0.5 }}>ロット数量:</Typography>
                          <TextField
                            type="number"
                            value={quantities[product["商品コード"]]?.lot || ''}
                            onChange={(e) => handleQuantityChange(product["商品コード"], 'lot', e.target.value)}
                            inputProps={{ min: 0 }}
                            size="small"
                            sx={{ width: '70px', mr: 0.5 }}
                          />
                          <Typography variant="body2" sx={{ mr: 2 }}>{formatUnit(product["ロット単位"]) || ''}</Typography>

                          <Typography variant="body2" color="textSecondary" sx={{ mr: 0.5 }}>バラ数量:</Typography>
                          <TextField
                            type="number"
                            value={quantities[product["商品コード"]]?.loose || ''}
                            onChange={(e) => handleQuantityChange(product["商品コード"], 'loose', e.target.value)}
                            inputProps={{ min: 0 }}
                            size="small"
                            sx={{ width: '70px', mr: 0.5 }}
                          />
                          <Typography variant="body2">{formatUnit(product["バラ単位"]) || ''}</Typography>
                        </Box>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>商品コード</TableCell>
                    <TableCell>商品名</TableCell>
                    <TableCell align="center">ロット数量</TableCell>
                    <TableCell align="center">バラ数量</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product["商品コード"]}>
                      <TableCell>{product["商品コード"]}</TableCell>
                      <TableCell>{product["商品名"]}</TableCell>
                      <TableCell align="right" sx={{ width: '100px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <TextField
                            type="number"
                            value={quantities[product["商品コード"]]?.lot || ''}
                            onChange={(e) => handleQuantityChange(product["商品コード"], 'lot', e.target.value)}
                            inputProps={{ min: 0 }}
                            size="small"
                            sx={{ width: '70px', mr: 0.5 }} // 単位との間に少しスペース
                          />
                          <Typography variant="body2">{formatUnit(product["ロット単位"]) || ''}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ width: '100px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <TextField
                            type="number"
                            value={quantities[product["商品コード"]]?.loose || ''}
                            onChange={(e) => handleQuantityChange(product["商品コード"], 'loose', e.target.value)}
                            inputProps={{ min: 0 }}
                            size="small"
                            sx={{ width: '70px', mr: 0.5 }} // 単位との間に少しスペース
                          />
                          <Typography variant="body2">{formatUnit(product["バラ単位"]) || ''}</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSave} color="primary" variant="contained" disabled={loading || products.length === 0}>
          保存
        </Button>
      </DialogActions>

      <LocationProductRegistrationDialog
        open={isProductRegistrationDialogOpen}
        onClose={handleCloseProductRegistrationDialog}
        locationId={locationId}
        locationName={locationName}
        onProductListUpdated={handleCloseProductRegistrationDialog} // 商品リスト更新後にInventoryFormDialogの商品を再フェッチ
      />
    </Dialog>
  );
}

export default InventoryFormDialog;