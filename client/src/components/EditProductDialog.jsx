import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, CircularProgress, Alert, Typography, IconButton, MenuItem, Autocomplete } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

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

function EditProductDialog({ open, handleClose, product, onProductUpdated, products, suppliers, lotUnits, pieceUnits }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 商品名を正規化するヘルパー関数
  const normalizeProductName = (name) => {
    if (!name) return '';
    let normalized = name.replace(/株式会社/g, '')
                         .replace(/有限会社/g, '')
                         .replace(/合同会社/g, '')
                         .replace(/合資会社/g, '')
                         .replace(/合名会社/g, '')
                         .replace(/㈱/g, '')
                         .replace(/㈲/g, '')
                         .replace(/㈾/g, '')
                         .replace(/\s+/g, ''); // 全角・半角スペースを削除
    return normalized.trim();
  };

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

    // 完全一致の重複チェック (商品コード)
    const exactCodeMatch = products.find(p => 
      p["商品コード"] === formData["商品コード"] && p["商品コード"] !== product["商品コード"] // 編集中の商品自身は除外
    );
    if (exactCodeMatch) {
      const confirmMessage = `商品コード「${formData["商品コード"]}」は既に登録されています。\nこのまま更新を続行しますか？`;
      if (!window.confirm(confirmMessage)) {
        setLoading(false);
        return;
      }
    }

    // あいまい一致の重複チェック (商品名)
    const normalizedNewProductName = normalizeProductName(formData["商品名"]);
    const ambiguousNameMatch = products.find(p => 
      normalizeProductName(p["商品名"]) === normalizedNewProductName && p["商品コード"] !== product["商品コード"] // 編集中の商品自身は除外
    );

    if (ambiguousNameMatch) {
      const confirmMessage = `商品名「${formData["商品名"]}」は、既存の商品「${ambiguousNameMatch["商品名"]}」と類似しています。\nこのまま更新を続行しますか？`;
      if (!window.confirm(confirmMessage)) {
        setLoading(false);
        return;
      }
    }

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

  if (!product) {
    return null;
  }

  return (
          <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                商品情報編集
              </Typography>
              {product && (
                <IconButton
                  color="error"
                  onClick={handleDelete}
                  sx={{ ml: 2 }} // タイトルとの間隔
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </DialogTitle>
            <DialogContent dividers sx={{ pt: 3 }}>        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ pt: 1 }}>
          {fieldOrder.map((key) => (
            // productオブジェクトにそのキーが存在し、かつ除外対象でない場合のみ表示
            product.hasOwnProperty(key) && key !== 'id' && key !== 'バーコード/QRコード' && (
              <Grid item xs={12} sm={6} key={key}>
                {key === "区分" ? (
                  <TextField
                    select
                    fullWidth
                    label="区分"
                    name="区分"
                    value={formData["区分"] || ''}
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
                    value={formData["仕入先ID"] || ''}
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
                    value={formData[key] || ''}
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
                    value={formData[key] || ''}
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
                    value={formData[key] || ''}
                    onChange={handleChange}
                    disabled={key === '商品コード'} // 商品コードは編集不可
                  />
                )}
              </Grid>
            )
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          キャンセル
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : '更新'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditProductDialog;
