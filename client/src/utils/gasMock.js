const gasMock = {
  _successHandler: null,
  _failureHandler: null,

  withSuccessHandler: function(handler) {
    this._successHandler = handler;
    return this;
  },

  withFailureHandler: function(handler) {
    this._failureHandler = handler;
    return this;
  },

  // 仕入れ先マスターのモックデータ
  _mockSuppliers: [
    { "仕入先ID": "S001", "仕入先名": "モック仕入れ先A", "連絡先": "000-1111-2222", "住所": "モック住所A" },
    { "仕入先ID": "S002", "仕入先名": "モック仕入れ先B", "連絡先": "000-3333-4444", "住所": "モック住所B" },
  ],

  getSuppliers: function() {
    console.log('GAS Mock: getSuppliers called');
    setTimeout(() => {
      this._successHandler({ status: 'success', data: this._mockSuppliers });
    }, 500);
  },

  addSupplier: function(supplierData) {
    console.log('GAS Mock: addSupplier called with', supplierData);
    setTimeout(() => {
      const newId = `S${String(this._mockSuppliers.length + 1).padStart(3, '0')}`;
      const newSupplier = { ...supplierData, "仕入先ID": newId };
      this._mockSuppliers.push(newSupplier);
      this._successHandler({ status: 'success', message: 'モック仕入れ先が追加されました。', supplier: newSupplier });
    }, 500);
  },

  editSupplier: function(supplierData) {
    console.log('GAS Mock: editSupplier called with', supplierData);
    setTimeout(() => {
      const index = this._mockSuppliers.findIndex(s => s["仕入先ID"] === supplierData["仕入先ID"]);
      if (index !== -1) {
        this._mockSuppliers[index] = { ...this._mockSuppliers[index], ...supplierData };
        this._successHandler({ status: 'success', message: 'モック仕入れ先が更新されました。', supplier: this._mockSuppliers[index] });
      } else {
        this._failureHandler({ status: 'error', message: 'モック仕入れ先が見つかりません。' });
      }
    }, 500);
  },

  deleteSupplier: function(supplierId) {
    console.log('GAS Mock: deleteSupplier called with', supplierId);
    setTimeout(() => {
      const initialLength = this._mockSuppliers.length;
      this._mockSuppliers = this._mockSuppliers.filter(s => s["仕入先ID"] !== supplierId);
      if (this._mockSuppliers.length < initialLength) {
        this._successHandler({ status: 'success', message: 'モック仕入れ先が削除されました。', supplierId: supplierId });
      } else {
        this._failureHandler({ status: 'error', message: 'モック仕入れ先が見つかりません。' });
      }
    }, 500);
  },

  // 他のGAS関数も必要に応じてモックを追加
};

export default gasMock;