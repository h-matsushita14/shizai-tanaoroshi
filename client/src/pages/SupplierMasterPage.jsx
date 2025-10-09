import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  CircularProgress, // CircularProgress を追加
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

function SupplierMasterPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null); // 編集中の仕入れ先
  const [newSupplierName, setNewSupplierName] = useState('');
  const [loading, setLoading] = useState(true); // loading ステートを追加

  // 仕入れ先名を正規化するヘルパー関数
  const normalizeSupplierName = (name) => {
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

  // .envからGASウェブアプリのURLを取得
  const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL;

  // 仕入れ先データをGASから取得する関数
  const fetchSuppliers = async () => {
    setLoading(true); // データ取得開始時にローディングをtrueに
    try {
      const response = await fetch(`${GAS_WEB_APP_URL}?action=getSuppliers`);
      const data = await response.json();
      if (data.status === 'success') {
        setSuppliers(data.data);
      } else {
        console.error('Failed to fetch suppliers:', data.message);
        alert('仕入れ先データの取得に失敗しました: ' + data.message);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      alert('仕入れ先データの取得中にエラーが発生しました。');
    } finally {
      setLoading(false); // データ取得完了時にローディングをfalseに
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []); // 初回レンダリング時にのみ実行

  const handleAddClick = () => {
    setEditingSupplier(null);
    setNewSupplierName('');
    setOpenDialog(true);
  };

  const handleEditClick = (supplier) => {
    setEditingSupplier(supplier);
    setNewSupplierName(supplier["仕入先名"]);
    setOpenDialog(true);
  };

  const handleDeleteClick = async (supplierId) => {
    if (window.confirm('この仕入れ先を削除してもよろしいですか？')) {
      try {
        const response = await fetch(`${GAS_WEB_APP_URL}?action=deleteSupplier`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ supplierId }), // GAS側でsupplierIdを直接受け取る
        });
        const data = await response.json();
        if (data.status === 'success') {
          alert(data.message);
          fetchSuppliers(); // データを再取得してUIを更新
        } else {
          console.error('Failed to delete supplier:', data.message);
          alert('仕入れ先の削除に失敗しました: ' + data.message);
        }
      } catch (error) {
        console.error('Error deleting supplier:', error);
        alert('仕入れ先の削除中にエラーが発生しました。');
      }
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

      const handleSaveSupplier = async () => {
        if (!newSupplierName.trim()) {
          alert('仕入れ先名を入力してください。');
          return;
        }
  
        // 完全一致の重複チェック
        const exactMatch = suppliers.find(s => {
          // 編集中の場合は自分自身との比較をスキップ
          if (editingSupplier && s["仕入先ID"] === editingSupplier["仕入先ID"]) {
            return false;
          }
          return s["仕入先名"] === newSupplierName;
        });
  
        if (exactMatch) {
          const confirmMessage = `「${newSupplierName}」は既に登録されています。\nこのまま登録を続行しますか？`;
          if (!window.confirm(confirmMessage)) {
            return; // ユーザーがキャンセルした場合
          }
        }
  
        const normalizedNewSupplierName = normalizeSupplierName(newSupplierName);
  
        // 既存の仕入れ先リストであいまい一致をチェック
        const ambiguousMatch = suppliers.find(s => {
          // 編集中の場合は自分自身との比較をスキップ
          if (editingSupplier && s["仕入先ID"] === editingSupplier["仕入先ID"]) {
            return false;
          }
          return normalizeSupplierName(s["仕入先名"]) === normalizedNewSupplierName;
        });
  
        if (ambiguousMatch) {
          const confirmMessage = `「${newSupplierName}」は、既存の仕入れ先「${ambiguousMatch["仕入先名"]}」と類似しています。\nこのまま登録を続行しますか？`;
          if (!window.confirm(confirmMessage)) {
            return; // ユーザーがキャンセルした場合
          }
        }
  
        const supplierData = { "仕入れ先名": newSupplierName };
    try {
      if (editingSupplier) {
        // 更新
        const updatedData = { ...editingSupplier, ...supplierData };
        const response = await fetch(`${GAS_WEB_APP_URL}?action=editSupplier`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedData),
        });
        const data = await response.json();
        if (data.status === 'success') {
          alert(data.message);
          fetchSuppliers(); // データを再取得してUIを更新
        } else {
          console.error('Failed to update supplier:', data.message);
          alert('仕入れ先の更新に失敗しました: ' + data.message);
        }
      } else {
        // 追加
        const response = await fetch(`${GAS_WEB_APP_URL}?action=addSupplier`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(supplierData),
        });
        const data = await response.json();
        if (data.status === 'success') {
          alert(data.message);
          fetchSuppliers(); // データを再取得してUIを更新
        } else {
          console.error('Failed to add supplier:', data.message);
          alert('仕入れ先の追加に失敗しました: ' + data.message);
        }
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('仕入れ先の保存中にエラーが発生しました。');
    }
    handleDialogClose();
  };

  return (
    <Box sx={{ mt: 4 }}>
      {/* タイトル行を削除 */}
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleAddClick}
        sx={{ mb: 2 }}
      >
        仕入れ先を追加
      </Button>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>仕入先ID</TableCell>
                <TableCell>仕入れ先名</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier["仕入先ID"]}>
                  <TableCell>{supplier["仕入先ID"]}</TableCell>
                  <TableCell>{supplier["仕入先名"]}</TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleEditClick(supplier)}>
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>{editingSupplier ? '仕入れ先を編集' : '仕入れ先を追加'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="仕入れ先名"
            type="text"
            fullWidth
            variant="standard"
            value={newSupplierName}
            onChange={(e) => setNewSupplierName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>キャンセル</Button>
          {editingSupplier && ( // 編集中の場合のみ削除ボタンを表示
            <Button
              color="error"
              onClick={() => {
                handleDeleteClick(editingSupplier["仕入先ID"]);
                handleDialogClose(); // 削除後ダイアログを閉じる
              }}
            >
              削除
            </Button>
          )}
          <Button onClick={handleSaveSupplier}>{editingSupplier ? '更新' : '追加'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SupplierMasterPage;