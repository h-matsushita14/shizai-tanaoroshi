import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  useMediaQuery, useTheme, List, ListItem, ListItemText, Tooltip // Tooltip を追加
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add'; // AddIcon をインポート
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'; // InfoOutlinedIcon を追加
import LocationProductRegistrationDialog from './LocationProductRegistrationDialog'; // 商品登録ダイアログをインポート

import { sendGetRequest, sendPostRequest } from '@/api/gas';

function InventoryFormDialog({ open, onClose, locationId, locationName, locationDetail, initialProducts, onLocationsUpdated }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [loading, setLoading] = useState(false); // initialProductsがあるため、初期ロードは不要
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({}); // 商品コードをキーとして { lot: '', loose: '' } を保持
  const [isProductRegistrationDialogOpen, setIsProductRegistrationDialogOpen] = useState(false); // 商品登録ダイアログの開閉状態

  const theme = useTheme(); // useTheme を追加
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('md')); // md以下の画面サイズでtrue

  useEffect(() => {
    if (!open) {
      setProducts([]);
      setQuantities({});
      return;
    }
    // initialProductsが更新されたらproductsステートも更新
    setProducts(initialProducts || []);
    // quantitiesの初期化
    const initialQuantities = {};
    (initialProducts || []).forEach(product => {
      initialQuantities[product["商品コード"]] = { lot: '', loose: '' }; // 初期値は空
    });
    setQuantities(initialQuantities);

  }, [open, initialProducts]);

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
      const result = await sendPostRequest('addInventoryRecord', { records: inventoryData });

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
    if (onLocationsUpdated) {
      onLocationsUpdated(); // ロケーションリストを再フェッチ
    }
  };

  const formatUnit = (unit) => {
    if (!unit) return '';
    const parts = unit.split('/');
    return parts[0];
  };

  // 棚卸入力状況の計算
  const totalProducts = products.length;
  const completedProducts = Object.keys(quantities).filter(productCode => {
    const { lot, loose } = quantities[productCode];
    return (lot !== '' && !isNaN(parseInt(lot, 10))) || (loose !== '' && !isNaN(parseInt(loose, 10)));
  }).length;

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
                <ListItem key={product["商品コード"]} divider sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <ListItemText
                      primary={
                        <Box>
                          {/* ラベルを削除 */}
                          <Typography
                            variant="subtitle1"
                            component="span"
                            sx={{
                              fontWeight: 'bold',
                              bgcolor: 'grey.100', // 目立たない程度の薄いグレー
                              p: 0.5, // パディング
                              borderRadius: '4px', // 角を丸くする
                              display: 'inline-block', // 背景色が値の幅に収まるように
                            }}
                          >
                            {product["社内名称"] || '-'}
                          </Typography>
                        </Box>
                      }
                    />
                    <Tooltip
                      title={
                        <Box>
                          <Typography variant="body2">商品コード: {product["商品コード"]}</Typography>
                          <Typography variant="body2">商品名: {product["商品名"]}</Typography>
                          <Typography variant="body2">棚卸数量: {product["棚卸数量"] || '-'}</Typography>
                          <Typography variant="body2">記録日時: {product["記録日時"] ? new Date(product["記録日時"]).toLocaleString() : '-'}</Typography>
                        </Box>
                      }
                      arrow
                      placement="top-end"
                      enterTouchDelay={0}
                      leaveTouchDelay={5000}
                    >
                      <IconButton size="small" sx={{ alignSelf: 'flex-start', mt: 0.5 }}>
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {/* 入力欄をListItemTextの外に移動 */}
                  <Box sx={{ mt: 0.5, width: '100%' }}>
                    {(() => {
                      const lotUnit = formatUnit(product["ロット単位"]);
                      const looseUnit = formatUnit(product["バラ単位"]);

                      if (!lotUnit && !looseUnit) {
                        return null;
                      }

                      if (lotUnit && looseUnit && lotUnit === looseUnit) {
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Typography variant="body2" color="textSecondary" sx={{ mr: 0.5 }}>数量:</Typography>
                            <TextField
                              type="number"
                              value={quantities[product["商品コード"]]?.loose || ''}
                              onChange={(e) => handleQuantityChange(product["商品コード"], 'loose', e.target.value)}
                              inputProps={{ min: 0 }}
                              size="small"
                              sx={{ width: '70px', mr: 0.5 }}
                            />
                            <Typography variant="body2">{looseUnit}</Typography>
                          </Box>
                        );
                      }

                      return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', mt: 1, gap: 1 }}> {/* 変更: flexWrap と gap を追加 */}
                          {lotUnit && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" color="textSecondary" sx={{ mr: 0.5 }}>ロット数量:</Typography>
                              <TextField
                                type="number"
                                value={quantities[product["商品コード"]]?.lot || ''}
                                onChange={(e) => handleQuantityChange(product["商品コード"], 'lot', e.target.value)}
                                inputProps={{ min: 0 }}
                                size="small"
                                sx={{ width: '70px', mr: 0.5 }}
                              />
                              <Typography variant="body2">{lotUnit}</Typography>
                            </Box>
                          )}
                          {looseUnit && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" color="textSecondary" sx={{ mr: 0.5 }}>バラ数量:</Typography>
                              <TextField
                                type="number"
                                value={quantities[product["商品コード"]]?.loose || ''}
                                onChange={(e) => handleQuantityChange(product["商品コード"], 'loose', e.target.value)}
                                inputProps={{ min: 0 }}
                                size="small"
                                sx={{ width: '70px', mr: 0.5 }}
                              />
                              <Typography variant="body2">{looseUnit}</Typography>
                            </Box>
                          )}
                        </Box>
                      );
                    })()}
                  </Box>
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
                    <TableCell align="center">棚卸数量</TableCell>
                    <TableCell align="center">記録日</TableCell>
                    <TableCell align="center">ロット数量</TableCell>
                    <TableCell align="center">バラ数量</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => {
                    const lotUnit = formatUnit(product["ロット単位"]);
                    const looseUnit = formatUnit(product["バラ単位"]);

                    const isSameUnit = lotUnit && looseUnit && lotUnit === looseUnit;

                    return (
                      <TableRow key={product["商品コード"]}>
                        <TableCell>{product["商品コード"]}</TableCell>
                        <TableCell>{product["商品名"]}</TableCell>
                        <TableCell align="right">{product["棚卸数量"] || '-'}</TableCell>
                        <TableCell align="right">{product["記録日時"] ? new Date(product["記録日時"]).toLocaleDateString() : '-'}</TableCell>
                        <TableCell align="right" sx={{ width: '100px' }}>
                          {/* ロットとバラの単位が同じでない場合、またはロット単位のみ存在する場合に表示 */}
                          {!isSameUnit && lotUnit && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                              <TextField
                                type="number"
                                value={quantities[product["商品コード"]]?.lot || ''}
                                onChange={(e) => handleQuantityChange(product["商品コード"], 'lot', e.target.value)}
                                inputProps={{ min: 0 }}
                                size="small"
                                sx={{ width: '70px', mr: 0.5 }}
                              />
                              <Typography variant="body2">{lotUnit}</Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ width: '100px' }}>
                          {/* バラ単位が存在し、かつ (ロットとバラの単位が同じ場合、またはロット単位がない場合) に表示 */}
                          {looseUnit && (isSameUnit || !lotUnit) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                              <TextField
                                type="number"
                                value={quantities[product["商品コード"]]?.loose || ''}
                                onChange={(e) => handleQuantityChange(product["商品コード"], 'loose', e.target.value)}
                                inputProps={{ min: 0 }}
                                size="small"
                                sx={{ width: '70px', mr: 0.5 }}
                              />
                              <Typography variant="body2">{looseUnit}</Typography>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 1.5 }}>
        <Typography variant="subtitle1" color="textSecondary">
          入力状況: {completedProducts}/{totalProducts}
        </Typography>
        <Box>
          <Button onClick={onClose}>キャンセル</Button>
          <Button onClick={handleSave} color="primary" variant="contained" disabled={loading || products.length === 0}>
            保存
          </Button>
        </Box>
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