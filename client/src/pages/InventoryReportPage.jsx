import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, CircularProgress, Alert, Select, MenuItem, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'; // Table関連コンポーネントを追加

const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL;

function InventoryReportPage() {
  const [outputFormat, setOutputFormat] = useState('csv'); // デフォルトはCSV
  const [loading, setLoading] = useState(false); // 出力ボタンのローディング
  const [error, setError] = useState(null); // 出力ボタンのエラー
  const [downloadUrl, setDownloadUrl] = useState(null);

  // 当日の年月をデフォルト値とする
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // getMonth() は0から始まるため +1

  // 西暦の選択肢を生成 (例: 過去5年と将来1年)
  const years = Array.from({ length: 7 }, (_, i) => today.getFullYear() - 5 + i); // 過去5年 + 当年 + 将来1年
  // 月の選択肢を生成
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // テーブル表示用のstate
  const [inventoryData, setInventoryData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState(null);

  // 年月が変更されたら棚卸記録を再取得
  useEffect(() => {
    const fetchInventoryData = async () => {
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
    };

    fetchInventoryData();
  }, [selectedYear, selectedMonth]); // 年月が変更されたら実行

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

      // CSVの場合は直接ダウンロード、Excel/PDFの場合はURLを取得してダウンロード
      if (outputFormat === 'csv') {
        const text = await response.text();
        const blob = new Blob([text], { type: mimeType });
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
          const url = result.data; // GASから返されるのはURL
          setDownloadUrl(url);

          // 新しいタブで開く
          window.open(url, '_blank');
        } else {
          throw new Error(result.message || 'ファイルの生成に失敗しました。');
        }
      }

    } catch (err) {
      setError(err.message);
      console.error('出力中にエラーが発生しました:', err);
    } finally {
      setLoading(false);
    }
  };

  // テーブルのヘッダーを抽出
  const tableHeaders = inventoryData.length > 0 ? Object.keys(inventoryData[0]) : [];

  return (
    <Box sx={{ p: 3 }}>
      {/* ページタイトルはApp.jsxで表示されるため削除 */}

      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel component="legend">出力形式を選択</FormLabel>
        <RadioGroup
          row
          aria-label="output-format"
          name="output-format-group"
          value={outputFormat}
          onChange={(e) => setOutputFormat(e.target.value)}
        >
          <FormControlLabel value="csv" control={<Radio />} label="CSV" />
          <FormControlLabel value="excel" control={<Radio />} label="Excel (xlsx)" />
          <FormControlLabel value="pdf" control={<Radio />} label="PDF" />
        </RadioGroup>
      </FormControl>

      {/* 年月選択プルダウン */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
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

      {tableLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>棚卸記録を読み込み中...</Typography>
        </Box>
      ) : tableError ? (
        <Alert severity="error" sx={{ mb: 2 }}>{tableError}</Alert>
      ) : inventoryData.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>選択された月には棚卸記録がありません。</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
          <Table stickyHeader size="small" sx={{ minWidth: 'max-content' }}>
            <TableHead>
              <TableRow>
                {tableHeaders.map((header) => (
                  <TableCell key={header} sx={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>{header}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {inventoryData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
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

      {error && <Alert severity="error" sx={{ mt: 2, mb: 2 }}>{error}</Alert>}
      {downloadUrl && <Alert severity="success" sx={{ mt: 2, mb: 2 }}>ファイルがダウンロードされました。</Alert>}

      <Button
        variant="contained"
        color="primary"
        onClick={handleOutput}
        disabled={loading || tableLoading || inventoryData.length === 0}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : '出力'}
      </Button>
    </Box>
  );
}

export default InventoryReportPage;
