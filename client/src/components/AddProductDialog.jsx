import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, MenuItem, CircularProgress, Alert, Autocomplete } from '@mui/material';

import { sendPostRequest } from '@/api/gas';

function AddProductDialog({ open, handleClose, onProductAdded, products, suppliers, lotUnits, pieceUnits }) {
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
  const [isInternalNameManuallyEdited, setIsInternalNameManuallyEdited] = useState(false);

  // ダイアログが開くときに state をリセットする
  useEffect(() => {
    if (open) {
      setFormData({
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
      setIsInternalNameManuallyEdited(false);
      setError(null);
    }
  }, [open]);

  // 「商品名」が変更されたら、「社内名称」を更新する副作用
  useEffect(() => {
    if (!isInternalNameManuallyEdited) {
      setFormData(prev => ({
        ...prev,
        "社内名称": prev["商品名"]
      }));
    }
  }, [formData["商品名"], isInternalNameManuallyEdited]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "社内名称") {
      setIsInternalNameManuallyEdited(true);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAutocompleteChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value || '',
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    // 商品コードの必須チェック
    if (!formData["商品コード"].trim()) {
      setError('商品コードは必須です。');
      setLoading(false);
      return;
    }
    // 商品名の必須チェック
    if (!formData["商品名"].trim()) {
      setError('商品名は必須です。');
      setLoading(false);
      return;
    }

    try {
      const result = await sendPostRequest('addProduct', { ...formData });

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
        <Grid container spacing={2} sx={{ pt: 1 }}>
          {Object.keys(formData).map((key) => (
            <Grid item xs={12} sm={6} key={key}>
              {key === "区分" ? (
                <TextField
                  select
                  fullWidth
                  label="区分"
                  name="区分"
                  value={formData["区分"]}
                  onChange={handleChange}
                >
                  <MenuItem value="資材">資材</MenuItem>
                  <MenuItem value="食材">食材</MenuItem>
                  <MenuItem value="その他">その他</MenuItem>
                </TextField>
              ) : key === "仕入先ID" ? (
                <TextField
                  select
                  fullWidth
                  label="仕入先ID"
                  name="仕入先ID"
                  value={formData["仕入先ID"]}
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>選択してください</em>
                  </MenuItem>
                  {suppliers && suppliers.map((supplier) => (
                    <MenuItem key={supplier["仕入先ID"]} value={supplier["仕入先ID"]}>
                      {`${supplier["仕入先ID"]}: ${supplier["仕入先名"]}`}
                    </MenuItem>
                  ))}
                </TextField>
              ) : key === "ロット単位" ? (
                <Autocomplete
                  freeSolo
                  options={lotUnits || []}
                  value={formData[key]}
                  onChange={(event, newValue) => {
                    handleAutocompleteChange(key, newValue);
                  }}
                  onInputChange={(event, newInputValue) => {
                    handleAutocompleteChange(key, newInputValue);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="ロット単位" name="ロット単位" />
                  )}
                />
              ) : key === "バラ単位" ? (
                <Autocomplete
                  freeSolo
                  options={pieceUnits || []}
                  value={formData[key]}
                  onChange={(event, newValue) => {
                    handleAutocompleteChange(key, newValue);
                  }}
                  onInputChange={(event, newInputValue) => {
                    handleAutocompleteChange(key, newInputValue);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="バラ単位" name="バラ単位" />
                  )}
                />
              ) : (
                <TextField
                  fullWidth
                  label={key}
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                />
              )}
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
