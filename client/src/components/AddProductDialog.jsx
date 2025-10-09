import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, MenuItem, CircularProgress, Alert } from '@mui/material';

function AddProductDialog({ open, handleClose, onProductAdded }) {
  const [formData, setFormData] = useState({
    "商品コード": '',
    "区分": '',
    "商品名": '',
    "社内名称": '',
    "仕入先ID": '',
    "規格": '',
    "単価": '',
    "ケース入数": '',
    "バラ単位": '',
    "ロット": '',
    "ロット単位": '',
    "リードタイム (日)": '',
    "安全在庫数": '',
    "備考1": '',
    "備考2": '',
    "備考3": '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const scriptUrl = import.meta.env.VITE_GAS_WEB_APP_URL;
      const response = await fetch(`${scriptUrl}?action=addProduct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();

      if (result.status === 'success') {
        onProductAdded(); // 親コンポーネントに通知
        handleClose();
      } else {
        throw new Error(result.message || '商品の追加に失敗しました。');
      }
    } catch (err) {
      setError('商品の追加中にエラーが発生しました。');
      console.error('Failed to add product:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>新規商品追加</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          {Object.keys(formData).map((key) => (
            <Grid item xs={12} sm={6} key={key}>
              <TextField
                fullWidth
                label={key}
                name={key}
                value={formData[key]}
                onChange={handleChange}
                type={['単価', 'ケース入数', 'バラ単位', 'ロット', 'リードタイム (日)', '安全在庫数'].includes(key) ? 'number' : 'text'}
                // 必要に応じてバリデーションを追加
              />
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          キャンセル
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : '追加'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddProductDialog;
