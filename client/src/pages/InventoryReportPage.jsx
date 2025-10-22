import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, CircularProgress, Alert, Select, MenuItem, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { sendPostRequest } from '@/api/gas'; // sendPostRequest をインポート

const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL;

function InventoryReportPage() {
  const [outputFormat, setOutputFormat] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

  const years = Array.from({ length: 7 }, (_, i) => today.getFullYear() - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const [inventoryData, setInventoryData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState(null);

  // 集計処理用のstate
  const [calculationLoading, setCalculationLoading] = useState(false);
  const [calculationError, setCalculationError] = useState(null);
  const [calculationSuccess, setCalculationSuccess] = useState(null);

  const fetchInventoryData = useCallback(async () => {
    setTableLoading(true);
    setTableError(null);
    try {
      const requestUrl = `${GAS_WEB_APP_URL}?action=getInventoryRecordsJson&year=${selectedYear}&month=${selectedMonth}`;
      const response = await fetch(requestUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.status === 'success') {
        setInventoryData(result.data);
      } else {
        throw new Error(result.message || '棚卸記録の取得に失敗しました。');
      }
    } catch (err) {
      setTableError(err.message);
      console.error('棚卸記録の取得中にエラーが発生しました:', err);
    } finally {
      setTableLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  const handleRunCalculation = async () => {
    setCalculationLoading(true);
    setCalculationError(null);
    setCalculationSuccess(null);
    try {
      const result = await sendPostRequest('runCostCalculation', {});
      if (result.status === 'success') {
        setCalculationSuccess(result.data.message || '集計が正常に完了しました。');
        // 集計成功後にデータを再取得
        fetchInventoryData();
      } else {
        throw new Error(result.message || '集計処理に失敗しました。');
      }
    } catch (err) {
      setCalculationError(err.message);
    } finally {
      setCalculationLoading(false);
    }
  };

  const handleOutput = async () => {
    setLoading(true);
    setError(null);
    setDownloadUrl(null);

    try {
      let action = '';
      let filename = '';
      let mimeType = '';

      switch (outputFormat) {
        case 'csv':
          action = 'exportInventoryRecordsCsv';
          filename = `棚卸記録_${selectedYear}年${selectedMonth}月.csv`;
          mimeType = 'text/csv';
          break;
        case 'excel':
          action = 'exportInventoryRecordsExcel';
          filename = `棚卸記録_${selectedYear}年${selectedMonth}月.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'pdf':
          action = 'exportInventoryRecordsPdf';
          filename = `棚卸記録_${selectedYear}年${selectedMonth}月.pdf`;
          mimeType = 'application/pdf';
          break;
        default:
          throw new Error('無効な出力形式です。');
      }

      const requestUrl = `${GAS_WEB_APP_URL}?action=${action}&year=${selectedYear}&month=${selectedMonth}`;
      const response = await fetch(requestUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (outputFormat === 'csv') {
        const text = await response.text();
        const blob = new Blob(["\uFEFF" + text], { type: `${mimeType};charset=utf-8;` }); // BOMを追加
        const url = window.URL.createObjectURL(blob);
        setDownloadUrl(url);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const result = await response.json();
        if (result.status === 'success') {
          const url = result.data;
          setDownloadUrl(url);
          window.open(url, '_blank');
        } else {
          throw new Error(result.message || 'ファイルの生成に失敗しました。');
        }
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tableHeaders = inventoryData.length > 0 ? Object.keys(inventoryData[0]) : [];

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Typography variant="h5" gutterBottom>集計と出力</Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>1. 最新の集計を実行</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          棚卸記録の最新データを集計し、下のプレビューテーブルを更新します。レポートを出力する前に必ず実行してください。
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleRunCalculation}
          disabled={calculationLoading}
        >
          {calculationLoading ? <CircularProgress size={24} /> : '最新の集計を実行'}
        </Button>
        {calculationError && <Alert severity="error" sx={{ mt: 2 }}>{calculationError}</Alert>}
        {calculationSuccess && <Alert severity="success" sx={{ mt: 2 }}>{calculationSuccess}</Alert>}
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>2. 期間と出力形式を選択</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="year-select-label">西暦</InputLabel>
            <Select
              labelId="year-select-label"
              value={selectedYear}
              label="西暦"
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>{year}年</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 100 }}>
            <InputLabel id="month-select-label">月</InputLabel>
            <Select
              labelId="month-select-label"
              value={selectedMonth}
              label="月"
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {months.map((month) => (
                <MenuItem key={month} value={month}>{month}月</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <FormControl component="fieldset">
          <FormLabel component="legend">出力形式</FormLabel>
          <RadioGroup
            row
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value)}
          >
            <FormControlLabel value="csv" control={<Radio />} label="CSV" />
            <FormControlLabel value="excel" control={<Radio />} label="Excel (xlsx)" />
            <FormControlLabel value="pdf" control={<Radio />} label="PDF" />
          </RadioGroup>
        </FormControl>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>3. プレビューと出力</Typography>
        {tableLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>棚卸記録を読み込み中...</Typography>
          </Box>
        ) : tableError ? (
          <Alert severity="error" sx={{ mb: 2 }}>{tableError}</Alert>
        ) : inventoryData.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>表示するデータがありません。集計を実行したか、対象年月に記録があるか確認してください。</Alert>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {tableHeaders.map((header) => (
                    <TableCell key={header} sx={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>{header}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {inventoryData.map((row, rowIndex) => (
                  <TableRow key={rowIndex} hover>
                    {tableHeaders.map((header) => (
                      <TableCell key={`${rowIndex}-${header}`} sx={{ whiteSpace: 'nowrap' }}>
                        {String(row[header])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={handleOutput}
          disabled={loading || tableLoading || calculationLoading || inventoryData.length === 0}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : '出力'}
        </Button>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {downloadUrl && <Alert severity="success" sx={{ mt: 2 }}>ファイルが正常に生成・ダウンロードされました。</Alert>}
      </Paper>
    </Box>
  );
}

export default InventoryReportPage;
