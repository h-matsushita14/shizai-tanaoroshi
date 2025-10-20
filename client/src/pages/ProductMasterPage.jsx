import React, { useState, useEffect } from 'react';
import { Box, Button, CircularProgress, Alert, TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TableSortLabel, FormControl, InputLabel, Select, MenuItem, useTheme, useMediaQuery, Card, CardContent, CardActions, Grid } from '@mui/material'; // Table関連コンポーネントを追加
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import AddProductDialog from '../components/AddProductDialog';
import EditProductDialog from '../components/EditProductDialog';
import ProductDetailsDialog from '../components/ProductDetailsDialog';

import { sendGetRequest, sendPostRequest } from '../api/gas.js';
import { useMasterData } from '../contexts/MasterDataContext'; // useMasterData をインポート

// ProductCard コンポーネント
const ProductCard = ({ product, handleViewDetails, handleEdit }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flexGrow: 1 }}>
      <Typography variant="h6" component="div">
        {product["商品名"]}
      </Typography>
      <Typography color="text.secondary">
        商品コード: {product["商品コード"]}
      </Typography>
      <Typography color="text.secondary">
        社内名称: {product["社内名称"]}
      </Typography>
      <Typography color="text.secondary">
        仕入先名: {product["仕入先名"]}
      </Typography>
      <Typography color="text.secondary">
        最終更新日: {product["最終更新日"] ? new Date(product["最終更新日"]).toLocaleDateString() : '-'}
      </Typography>
    </CardContent>
    <CardActions>
      <Button size="small" onClick={() => handleViewDetails(product)}>詳細</Button>
      <Button size="small" onClick={() => handleEdit(product)}>編集</Button>
    </CardActions>
  </Card>
);

function ProductMasterPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [supplierFilter, setSupplierFilter] = useState(''); // 仕入先名フィルターの状態
  const [searchTerm, setSearchTerm] = useState(''); // 統合検索キーワードの状態
  const [orderBy, setOrderBy] = useState('商品コード'); // ソート対象の列
  const [order, setOrder] = useState('asc'); // ソート順 (asc/desc)
  const [suppliers, setSuppliers] = useState([]); // 仕入先リストの状態
  const [lotUnits, setLotUnits] = useState([]);
  const [pieceUnits, setPieceUnits] = useState([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // md以下の画面サイズでtrue

  // .envからGASウェブアプリのURLを取得
  const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_API_URL;

  const { updateProducts, updateSuppliers } = useMasterData(); // updateProducts と updateSuppliers を取得

  useEffect(() => {
    fetchProducts();
    fetchSuppliers(); // 仕入先データを取得
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await sendGetRequest('getProducts');
      if (result.status === 'success') {
        const productsWithId = result.data.map((product, index) => ({
          id: product["商品コード"] || index, // 商品コードをidとして使用、なければindex
          ...product,
        }));
        setProducts(productsWithId);
        updateProducts(result.data); // MasterDataContext を更新

        const lotUnitsSet = new Set(result.data.map(p => p['ロット単位']).filter(Boolean));
        const pieceUnitsSet = new Set(result.data.map(p => p['バラ単位']).filter(Boolean));
        setLotUnits([...lotUnitsSet]);
        setPieceUnits([...pieceUnitsSet]);

      } else {
        throw new Error(result.message || '商品データの取得に失敗しました。');
      }
    } catch (err) {
      setError('商品データの取得に失敗しました。');
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const result = await sendGetRequest('getSuppliers');
      if (result.status === 'success') {
        setSuppliers(result.data);
        updateSuppliers(result.data); // MasterDataContext を更新
      } else {
        console.error('Failed to fetch suppliers:', result.message);
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  // フィルターされた商品リスト
  const filteredProducts = products.filter(product =>
    (supplierFilter === '' || product["仕入先名"].toLowerCase() === supplierFilter.toLowerCase()) &&
    (
      product["商品名"].toLowerCase().includes(searchTerm.toLowerCase()) ||
      product["社内名称"].toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // ソート処理
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];

    // 日付の比較
    if (orderBy === '最終更新日') {
      const dateA = new Date(aValue);
      const dateB = new Date(bValue);
      if (dateA < dateB) return order === 'asc' ? -1 : 1;
      if (dateA > dateB) return order === 'asc' ? 1 : -1;
      return 0;
    }

    // 数値の比較 (例: 単価)
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // 文字列の比較
    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const columns = [
    { field: '商品コード', headerName: '商品コード', width: '10%' },
    { field: '商品名', headerName: '商品名', width: '25%' },
    { field: '社内名称', headerName: '社内名称', width: '15%' },
    { field: '仕入先名', headerName: '仕入先名', width: '15%' },
    { field: '最終更新日', headerName: '最終更新日', width: '15%' },
    {
      field: 'actions',
      headerName: '操作',
      width: '20%',
      sortable: false, // ソート不可に設定
      renderCell: (params) => (
        <>
          <Button
            variant="outlined"
            color="info"
            size="small"
            onClick={() => handleViewDetails(params.row)}
            sx={{ mr: 1 }}
          >
            詳細
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => handleEdit(params.row)}
            sx={{ mr: 1 }}
          >
            編集
          </Button>
        </>
      ),
    },
  ];

  const handleAdd = () => {
    setIsAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingProduct(null);
  };

  const handleViewDetails = (product) => {
    setViewingProduct(product);
    setIsDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setIsDetailsDialogOpen(false);
    setViewingProduct(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>商品データを読み込み中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={fetchProducts} sx={{ mt: 2 }}>
          再試行
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, overflowX: 'hidden' }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <FormControl sx={{ width: '200px' }}>
          <InputLabel id="supplier-filter-label">仕入先名でフィルター</InputLabel>
          <Select
            labelId="supplier-filter-label"
            value={supplierFilter}
            label="仕入先名でフィルター"
            onChange={(e) => setSupplierFilter(e.target.value)}
          >
            <MenuItem value="">すべて</MenuItem>
            {suppliers.map((supplier) => (
              <MenuItem key={supplier["仕入先ID"]} value={supplier["仕入先名"]}>
                {supplier["仕入先名"]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="商品名または社内名称で検索"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: '250px' }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ ml: 'auto' }}
        >
          {!isMobile && "新規商品追加"}
        </Button>
      </Box>
      {isMobile ? (
        <Grid container spacing={2}>
          {sortedProducts.map((product) => (
            <Grid item xs={12} sm={12} md={4} key={product.id}>
              <ProductCard
                product={product}
                handleViewDetails={handleViewDetails}
                handleEdit={handleEdit}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 600, overflow: 'auto' }}> {/* 変更 */}
          <Table stickyHeader aria-label="商品マスターテーブル" sx={{ tableLayout: 'fixed', width: '100%' }}> {/* 変更 */}
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.field}
                    sortDirection={orderBy === column.field ? order : false}
                    style={{ width: column.width }} // minWidth から width に変更
                  >
                    {column.headerName !== '操作' ? (
                      <TableSortLabel
                        active={orderBy === column.field}
                        direction={orderBy === column.field ? order : 'asc'}
                        onClick={() => handleRequestSort(column.field)}
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        {column.headerName}
                      </TableSortLabel>
                    ) : (
                      column.headerName
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedProducts.map((product) => (
                <TableRow hover key={product.id}>
                  {columns.map((column) => (
                    <TableCell key={`${product.id}-${column.field}`}>
                      {column.renderCell ? column.renderCell({ row: product }) : product[column.field]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <AddProductDialog
        open={isAddDialogOpen}
        handleClose={handleCloseAddDialog}
        onProductAdded={fetchProducts}
        products={products}
        suppliers={suppliers}
        lotUnits={lotUnits}
        pieceUnits={pieceUnits}
      />
      <EditProductDialog
        open={isEditDialogOpen}
        handleClose={handleCloseEditDialog}
        product={editingProduct}
        onProductUpdated={fetchProducts}
        products={products}
        suppliers={suppliers}
        lotUnits={lotUnits}
        pieceUnits={pieceUnits}
      />
      <ProductDetailsDialog
        open={isDetailsDialogOpen}
        handleClose={handleCloseDetailsDialog}
        product={viewingProduct}
      />
    </Box>
  );
}

export default ProductMasterPage;
