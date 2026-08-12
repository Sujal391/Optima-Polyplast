import React, { useState, useEffect } from 'react';
import {
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Plus, RefreshCw } from 'lucide-react';
import Sidebar from '../layout/Sidebar';
import { addFormula, getFormulas } from '../../services/api/stock';

export default function FormulaManagement() {
  const [formulas, setFormulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    formula: '',
    unit: '',
    description: '',
  });

  useEffect(() => {
    fetchFormulas();
  }, []);

  const fetchFormulas = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getFormulas();
      if (response.success) {
        setFormulas(response.data);
      } else {
        setError(response.message || 'Failed to fetch formulas');
      }
    } catch (err) {
      setError(err.message || 'Error fetching formulas');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFormula = async () => {
    if (!formData.name || !formData.formula || !formData.unit) {
      setSnackbarMessage('Please fill all required fields');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
      return;
    }

    try {
      const response = await addFormula(formData);
      if (response.success) {
        setSnackbarMessage('Formula added successfully');
        setSnackbarSeverity('success');
        setShowSnackbar(true);
        setFormData({ name: '', formula: '', unit: '', description: '' });
        setOpenDialog(false);
        fetchFormulas();
      }
    } catch (err) {
      setSnackbarMessage(err.message || 'Error adding formula');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 p-6 ml-64 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Formula Management</h1>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Plus size={20} />}
              onClick={() => setOpenDialog(true)}
            >
              Add Formula
            </Button>
          </div>

          {error && (
            <Alert severity="error" className="mb-4">
              {error}
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Formula</strong></TableCell>
                  <TableCell><strong>Unit</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Created At</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formulas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      No formulas found
                    </TableCell>
                  </TableRow>
                ) : (
                  formulas.map(formula => (
                    <TableRow key={formula._id} hover>
                      <TableCell>{formula.name}</TableCell>
                      <TableCell>{formula.formula}</TableCell>
                      <TableCell>{formula.unit}</TableCell>
                      <TableCell>{formula.description || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          formula.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {formula.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(formula.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Formula</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Formula"
            value={formData.formula}
            onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddFormula} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

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

