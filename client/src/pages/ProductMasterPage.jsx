import React, { useState, useEffect } from 'react';
import { Box, Button, CircularProgress, Alert, TextField, Typography } from '@mui/material'; // Typography を追加
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import AddProductDialog from '../components/AddProductDialog';
import EditProductDialog from '../components/EditProductDialog';
import ProductDetailsDialog from '../components/ProductDetailsDialog';

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

  // .envからGASウェブアプリのURLを取得
  const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const fullUrl = `${GAS_WEB_APP_URL}?action=getProducts`;
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.status === 'success') {
        const productsWithId = result.data.map((product, index) => ({
          id: product["商品コード"] || index, // 商品コードをidとして使用、なければindex
          ...product,
        }));
        setProducts(productsWithId);
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

  // フィルターされた商品リスト
  const filteredProducts = products.filter(product =>
    product["仕入先名"].toLowerCase().includes(supplierFilter.toLowerCase())
  );

  const columns = [
    { field: '商品コード', headerName: '商品コード', width: 120 },
    { field: '商品名', headerName: '商品名', width: 250 },
    { field: '社内名称', headerName: '社内名称', width: 150 },
    { field: '仕入先名', headerName: '仕入先名', width: 150 },
    { field: '最終更新日', headerName: '最終更新日', width: 150 },
    {
      field: 'actions',
      headerName: '操作',
      width: 250,
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
    <Box sx={{ p: 3 }}>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleAdd}
        sx={{ mb: 2 }}
      >
        新規商品追加
      </Button>
      <TextField
        label="仕入先名でフィルター"
        variant="outlined"
        value={supplierFilter}
        onChange={(e) => setSupplierFilter(e.target.value)}
        sx={{ mb: 2, width: '300px' }}
      />
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredProducts}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          checkboxSelection={false}
          disableRowSelectionOnClick
        />
      </div>
      <AddProductDialog
        open={isAddDialogOpen}
        handleClose={handleCloseAddDialog}
        onProductAdded={fetchProducts}
        products={products} // 重複チェックのために商品リストを渡す
      />
      <EditProductDialog
        open={isEditDialogOpen}
        handleClose={handleCloseEditDialog}
        product={editingProduct}
        onProductUpdated={fetchProducts}
        products={products} // 重複チェックのために商品リストを渡す
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