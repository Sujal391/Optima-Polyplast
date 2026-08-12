import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  Typography,
  Grid,
} from '@mui/material';
import { Download } from 'lucide-react';
import Sidebar from '../layout/Sidebar';
import {
  exportStockReport,
  exportProductionReport,
  exportWastageReport,
} from '../../services/api/stock';
import { downloadFile, generateFilename } from '../../utils/exportHelper';

export default function ReportsExport() {
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isSidebarOpen] = useState(true);

  // Production Report filters
  const [prodFilters, setProdFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'all',
    format: 'csv',
  });

  // Wastage Report filters
  const [wastageFilters, setWastageFilters] = useState({
    startDate: '',
    endDate: '',
    source: '',
    wastageType: '',
    format: 'csv',
  });

  const handleExportStock = async (format) => {
    setLoading(true);
    try {
      const blob = await exportStockReport(format);
      downloadFile(blob, generateFilename('stock', format));
      setSnackbarMessage('Stock report exported successfully');
      setSnackbarSeverity('success');
    } catch (err) {
      setSnackbarMessage(err.message || 'Error exporting stock report');
      setSnackbarSeverity('error');
    } finally {
      setLoading(false);
      setShowSnackbar(true);
    }
  };

  const handleExportProduction = async () => {
    setLoading(true);
    try {
      const params = {
        ...prodFilters,
        format: prodFilters.format,
      };
      const blob = await exportProductionReport(params);
      downloadFile(blob, generateFilename('production', prodFilters.format));
      setSnackbarMessage('Production report exported successfully');
      setSnackbarSeverity('success');
    } catch (err) {
      setSnackbarMessage(err.message || 'Error exporting production report');
      setSnackbarSeverity('error');
    } finally {
      setLoading(false);
      setShowSnackbar(true);
    }
  };

  const handleExportWastage = async () => {
    setLoading(true);
    try {
      const params = {
        ...wastageFilters,
        format: wastageFilters.format,
      };
      const blob = await exportWastageReport(params);
      downloadFile(blob, generateFilename('wastage', wastageFilters.format));
      setSnackbarMessage('Wastage report exported successfully');
      setSnackbarSeverity('success');
    } catch (err) {
      setSnackbarMessage(err.message || 'Error exporting wastage report');
      setSnackbarSeverity('error');
    } finally {
      setLoading(false);
      setShowSnackbar(true);
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 p-6 ml-64 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Export Reports</h1>

          <Grid container spacing={3}>
            {/* Stock Report */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" className="mb-4">
                    Stock Report
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Download size={20} />}
                      onClick={() => handleExportStock('csv')}
                      disabled={loading}
                    >
                      Export CSV
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<Download size={20} />}
                      onClick={() => handleExportStock('excel')}
                      disabled={loading}
                    >
                      Export Excel
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Production Report */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" className="mb-4">
                    Production Report
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      type="date"
                      label="Start Date"
                      InputLabelProps={{ shrink: true }}
                      value={prodFilters.startDate}
                      onChange={(e) =>
                        setProdFilters({ ...prodFilters, startDate: e.target.value })
                      }
                      size="small"
                    />
                    <TextField
                      type="date"
                      label="End Date"
                      InputLabelProps={{ shrink: true }}
                      value={prodFilters.endDate}
                      onChange={(e) =>
                        setProdFilters({ ...prodFilters, endDate: e.target.value })
                      }
                      size="small"
                    />
                    <Select
                      value={prodFilters.type}
                      onChange={(e) =>
                        setProdFilters({ ...prodFilters, type: e.target.value })
                      }
                      size="small"
                    >
                      <MenuItem value="all">All Types</MenuItem>
                      <MenuItem value="preform">Preform</MenuItem>
                      <MenuItem value="cap">Cap</MenuItem>
                      <MenuItem value="bottle">Bottle</MenuItem>
                      <MenuItem value="general">General</MenuItem>
                    </Select>
                    <Select
                      value={prodFilters.format}
                      onChange={(e) =>
                        setProdFilters({ ...prodFilters, format: e.target.value })
                      }
                      size="small"
                    >
                      <MenuItem value="csv">CSV</MenuItem>
                      <MenuItem value="excel">Excel</MenuItem>
                    </Select>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Download size={20} />}
                      onClick={handleExportProduction}
                      disabled={loading}
                    >
                      Export
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Wastage Report */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" className="mb-4">
                    Wastage Report
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      type="date"
                      label="Start Date"
                      InputLabelProps={{ shrink: true }}
                      value={wastageFilters.startDate}
                      onChange={(e) =>
                        setWastageFilters({ ...wastageFilters, startDate: e.target.value })
                      }
                      size="small"
                    />
                    <TextField
                      type="date"
                      label="End Date"
                      InputLabelProps={{ shrink: true }}
                      value={wastageFilters.endDate}
                      onChange={(e) =>
                        setWastageFilters({ ...wastageFilters, endDate: e.target.value })
                      }
                      size="small"
                    />
                    <Select
                      value={wastageFilters.source}
                      onChange={(e) =>
                        setWastageFilters({ ...wastageFilters, source: e.target.value })
                      }
                      displayEmpty
                      size="small"
                    >
                      <MenuItem value="">All Sources</MenuItem>
                      <MenuItem value="Preform">Preform</MenuItem>
                      <MenuItem value="Cap">Cap</MenuItem>
                      <MenuItem value="Bottle">Bottle</MenuItem>
                    </Select>
                    <Select
                      value={wastageFilters.wastageType}
                      onChange={(e) =>
                        setWastageFilters({ ...wastageFilters, wastageType: e.target.value })
                      }
                      displayEmpty
                      size="small"
                    >
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="Type 1: Reusable Wastage">Reusable</MenuItem>
                      <MenuItem value="Type 2: Non-reusable / Scrap">Scrap</MenuItem>
                    </Select>
                    <Select
                      value={wastageFilters.format}
                      onChange={(e) =>
                        setWastageFilters({ ...wastageFilters, format: e.target.value })
                      }
                      size="small"
                    >
                      <MenuItem value="csv">CSV</MenuItem>
                      <MenuItem value="excel">Excel</MenuItem>
                    </Select>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Download size={20} />}
                      onClick={handleExportWastage}
                      disabled={loading}
                    >
                      Export
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </div>
      </div>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
      >
        <Alert severity={snackbarSeverity}>{snackbarMessage}</Alert>
      </Snackbar>
    </div>
  );
}

