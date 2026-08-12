import React, { useState, useEffect } from 'react';
import { X, Calendar, Package, AlertCircle, User, FileText, Trash2 } from 'lucide-react';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { Alert, AlertDescription } from '../../ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';

// Import your API function
import { getPreformProductionById } from '../../../services/api/stock';

export default function PreformDetails({ productionId, isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detailsData, setDetailsData] = useState(null);

  useEffect(() => {
    if (isOpen && productionId) {
      fetchProductionDetails();
    }
  }, [isOpen, productionId]);

  const fetchProductionDetails = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await getPreformProductionById(productionId);
    
    if (response.status) {
      // Sort records by createdAt in descending order (newest first)
      const sortedResponse = {
        ...response,
        data: response.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )
      };
      setDetailsData(sortedResponse);
    } else {
      setError('Failed to load production details');
    }
  } catch (err) {
    setError(err.message || 'Failed to fetch production details');
  } finally {
    setLoading(false);
  }
};  

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClose = () => {
    setDetailsData(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Preform Production Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about preform production records
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && detailsData && (
          <div className="space-y-6">
            {/* Summary Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Production Summary</CardTitle>
                <CardDescription>
                  Overview of all production records for this preform type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Preform Type</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {detailsData.preform.preformType}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Total Produced</p>
                    <p className="text-2xl font-bold text-green-700">
                      {detailsData.preform.totalProduced.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <p className="text-sm text-gray-600 mb-1">Total Wastage</p>
                    <p className="text-2xl font-bold text-orange-700">
                      {detailsData.preform.totalWastage}
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <Badge variant="outline" className="text-sm">
                    {detailsData.count} Production Record{detailsData.count !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Individual Production Records Table */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Production Records
              </h3>
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>Date / ID</TableHead>
                      <TableHead>Finished Good</TableHead>
                      <TableHead>Lumps Scrap</TableHead>
                      <TableHead>PET Scrap</TableHead>
                      <TableHead>Total Wastage</TableHead>
                      <TableHead>Raw Materials Used</TableHead>
                      <TableHead>Remarks / User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailsData.data.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium whitespace-nowrap">{formatDate(record.productionDate)}</span>
                            <span className="text-xs text-gray-500">ID: {record._id.slice(-6)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-gray-900">{record.quantityProduced} Kg</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-yellow-600 font-medium">{record.wastageType1} Kg</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-red-600 font-medium">{record.wastageType2} Kg</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-orange-600 font-medium">{record.totalWastage} Kg</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {record.rawMaterials.map((material) => (
                              <div key={material._id} className="text-xs">
                                <span className="font-medium">{material.material.itemName}</span>: {material.quantityUsed} Kg
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-700">{record.remarks || "-"}</span>
                            <span className="text-xs text-gray-500">By {record.recordedBy?.name}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}