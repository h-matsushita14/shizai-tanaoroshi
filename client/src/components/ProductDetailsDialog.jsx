import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Grid, Box } from '@mui/material';

function ProductDetailsDialog({ open, handleClose, product }) {
  if (!product) {
    return null; // 商品データがない場合は何も表示しない
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>商品詳細: {product["商品名"]}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {Object.keys(product).map((key) => (
            key !== 'id' && (
              <Grid item xs={12} sm={6} key={key}>
                <Typography variant="subtitle2" color="text.secondary">
                  {key}
                </Typography>
                <Typography variant="body1">
                  {product[key] !== null && product[key] !== undefined && product[key] !== ''
                    ? String(product[key])
                    : '-'}
                </Typography>
              </Grid>
            )
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ProductDetailsDialog;
