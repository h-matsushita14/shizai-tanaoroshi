import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, CircularProgress, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

function EditProductDialog({ open, handleClose, product, onProductUpdated }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

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
      const response = await fetch(`${scriptUrl}?action=editProduct`, {
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
        onProductUpdated(); // 親コンポーネントに通知
        handleClose();
      } else {
        throw new Error(result.message || '商品の更新に失敗しました。');
      }
    } catch (err) {
      setError('商品の更新中にエラーが発生しました。');
      console.error('Failed to update product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product || !product["商品コード"]) {
      setError('削除する商品が特定できません。');
      return;
    }

    if (window.confirm(`商品コード: ${product["商品コード"]} の商品を削除してもよろしいですか？`)) {
      setLoading(true);
      setError(null);
      try {
        const scriptUrl = import.meta.env.VITE_GAS_WEB_APP_URL;
        const response = await fetch(`${scriptUrl}?action=deleteProduct`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ "商品コード": product["商品コード"] }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        if (result.status === 'success') {
          onProductUpdated(); // 親コンポーネントに通知
          handleClose();
        } else {
          throw new Error(result.message || '商品の削除に失敗しました。');
        }
      } catch (err) {
        setError('商品の削除中にエラーが発生しました。');
        console.error('Failed to delete product:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>商品情報編集</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          {product && Object.keys(product).map((key) => (
            // idは表示しない、商品コードは編集不可、バーコード/QRコードは表示しない
            key !== 'id' && key !== 'バーコード/QRコード' && (
              <Grid item xs={12} sm={6} key={key}>
                <TextField
                  fullWidth
                  label={key}
                  name={key}
                  value={formData[key] || ''}
                  onChange={handleChange}
                  type={['単価', 'ケース入数', 'バラ単位', 'ロット', 'リードタイム (日)', '安全在庫数'].includes(key) ? 'number' : 'text'}
                  disabled={key === '商品コード'} // 商品コードは編集不可
                />
              </Grid>
            )
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          キャンセル
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : '更新'}
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleDelete}
          disabled={loading}
          sx={{ ml: 2 }} // 左マージンを追加して他のボタンと区別
        >
          削除
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditProductDialog;
