import React, { useState, useEffect } from 'react';
import {
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
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
import { addCategory, getCategories } from '../../services/api/stock';

const CATEGORY_TYPES = ['Color', 'Bottle Type', 'Cap Type', 'Preform Type'];

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    code: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getCategories();
      if (response.success) {
        setCategories(response.data);
      } else {
        setError(response.message || 'Failed to fetch categories');
      }
    } catch (err) {
      setError(err.message || 'Error fetching categories');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!formData.type || !formData.name || !formData.code) {
      setSnackbarMessage('Please fill all required fields');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
      return;
    }

    try {
      const response = await addCategory(formData);
      if (response.success) {
        setSnackbarMessage('Category added successfully');
        setSnackbarSeverity('success');
        setShowSnackbar(true);
        setFormData({ type: '', name: '', code: '' });
        setOpenDialog(false);
        fetchCategories();
      }
    } catch (err) {
      setSnackbarMessage(err.message || 'Error adding category');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    }
  };

  const filteredCategories = filterType
    ? categories.filter(cat => cat.type === filterType)
    : categories;

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
            <h1 className="text-3xl font-bold text-gray-800">Category Management</h1>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Plus size={20} />}
              onClick={() => setOpenDialog(true)}
            >
              Add Category
            </Button>
          </div>

          {error && (
            <Alert severity="error" className="mb-4">
              {error}
            </Alert>
          )}

          <Card className="mb-6">
            <CardContent>
              <Select
                fullWidth
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">All Types</MenuItem>
                {CATEGORY_TYPES.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </CardContent>
          </Card>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Code</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Created At</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      No categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map(category => (
                    <TableRow key={category._id} hover>
                      <TableCell>{category.type}</TableCell>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.code}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          category.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(category.createdAt).toLocaleDateString()}
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
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Select
            fullWidth
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            displayEmpty
            sx={{ mb: 2 }}
          >
            <MenuItem value="">Select Type</MenuItem>
            {CATEGORY_TYPES.map(type => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </Select>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddCategory} variant="contained" color="primary">
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

