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
  TableSortLabel, // TableSortLabel を追加
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
  const [searchTerm, setSearchTerm] = useState(''); // 仕入先名検索キーワードの状態
  const [orderBy, setOrderBy] = useState('仕入先ID'); // ソート対象の列
  const [order, setOrder] = useState('asc'); // ソート順 (asc/desc)

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
        // 各仕入先に一意のIDを付与（DataGridの要件に合わせる）
        const suppliersWithId = data.data.map((supplier, index) => ({
          id: supplier["仕入先ID"] || index, // 仕入先IDをidとして使用、なければindex
          ...supplier,
        }));
        setSuppliers(suppliersWithId);
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

  // フィルターされた仕入れ先リスト
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier["仕入先名"].toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ソート処理
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];

    // 数値の比較 (例: 仕入先IDが数値の場合)
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // 文字列の比較
    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

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
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          label="仕入先名で検索"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: '250px' }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          sx={{ ml: 'auto' }}
        >
          仕入れ先を追加
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sortDirection={orderBy === '仕入先ID' ? order : false}>
                  <TableSortLabel
                    active={orderBy === '仕入先ID'}
                    direction={orderBy === '仕入先ID' ? order : 'asc'}
                    onClick={() => handleRequestSort('仕入先ID')}
                  >
                    仕入先ID
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === '仕入先名' ? order : false}>
                  <TableSortLabel
                    active={orderBy === '仕入先名'}
                    direction={orderBy === '仕入先名' ? order : 'asc'}
                    onClick={() => handleRequestSort('仕入先名')}
                  >
                    仕入れ先名
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedSuppliers.map((supplier) => (
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
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {editingSupplier ? '仕入れ先を編集' : '仕入れ先を追加'}
          </Typography>
          {editingSupplier && (
            <IconButton
              color="error"
              onClick={() => {
                handleDeleteClick(editingSupplier["仕入先ID"]);
                handleDialogClose();
              }}
              sx={{ ml: 2 }} // タイトルとの間隔
            >
              <DeleteIcon />
            </IconButton>
          )}
        </DialogTitle>
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
          <Button onClick={handleSaveSupplier}>{editingSupplier ? '更新' : '追加'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SupplierMasterPage;