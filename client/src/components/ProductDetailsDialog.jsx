import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Grid, Box } from '@mui/material';

// 表示するフィールドの順序を定義
const fieldOrder = [
  "商品コード",
  "区分",
  "商品名",
  "社内名称",
  "仕入先ID",
  "仕入先名",
  "規格",
  "単価",
  "ケース入数",
  "バラ単位",
  "ロット",
  "ロット単位",
  "リードタイム (日)",
  "安全在庫数",
  "備考1",
  "備考2",
  "備考3",
  "最終更新日"
];

function ProductDetailsDialog({ open, handleClose, product }) {
  if (!product) {
    return null; // 商品データがない場合は何も表示しない
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>商品詳細: {product["商品名"]}</DialogTitle>
      <DialogContent dividers sx={{ pt: 3 }}>
        <Grid container spacing={2}>
          {fieldOrder.map((key) => (
            product.hasOwnProperty(key) && (
              <Grid item xs={12} sm={6} key={key}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ mb: 0.5 }}>
                  {key}
                </Typography>
                <Box sx={{
                  border: '1px solid #e0e0e0', // 薄いグレーの枠線
                  borderRadius: '4px', // 角を丸くする
                  p: 1, // 内側の余白
                  bgcolor: '#f5f5f5', // わずかに背景色を付ける
                  minHeight: '40px', // 最小の高さを設定
                  display: 'flex', // flexboxで内容を中央揃え
                  alignItems: 'center', // 垂直方向中央揃え
                }}>
                  <Typography variant="body1">
                  {product[key] !== null && product[key] !== undefined && product[key] !== ''
                    ? String(product[key])
                    : '-'}
                </Typography>
                </Box>
              </Grid>
            )
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ProductDetailsDialog;