import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  X,
  TrendingUp,
  Tag,
  Box,
  Layers,
  Calendar,
  DollarSign,
  Percent,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import Paginator from "../shared/Paginator";

const api = axios.create({
  baseURL: process.env.REACT_APP_API,
});

api.interceptors.request.use(
  (config) => {
    const token = cookies.get("token");
    if (token) {
      config.headers.Authorization = token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const Product = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [productType, setProductType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, [productType, selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = cookies.get("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const params = {};
      if (productType) params.type = productType;
      if (selectedCategory) params.category = selectedCategory;

      const response = await api.get("/admin/products", { params });
      setProducts(response.data.products || []);
      setError(null);
    } catch (error) {
      console.error("There was a problem fetching the products:", error);
      setError(error.response?.data?.message || error.message);
      setProducts([]);
      if (
        error.response?.status === 401 ||
        error.message === "No authentication token found"
      ) {
        cookies.remove("token");
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowUploadForm(true);
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      const token = cookies.get("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      await api.delete(`/admin/products/${productToDelete._id}`);
      await fetchProducts();
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      setError(error.response?.data?.message || error.message);
      if (
        error.response?.status === 401 ||
        error.message === "No authentication token found"
      ) {
        cookies.remove("token");
        window.location.href = "/login";
      }
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pagedProducts = filteredProducts.slice(startIndex, endIndex);

  const productStats = {
    total: products.length,
    bottles: products.filter(p => p.type === "Bottle").length,
    rawMaterials: products.filter(p => p.type === "Raw Material").length,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-6"
    >
      {/* Page Header */}
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        {/* LEFT SIDE */}
        <div>
          <motion.h1
            className="text-xl md:text-2xl font-bold text-slate-800"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Product Management
          </motion.h1>

          <motion.p
            className="text-sm md:text-base text-slate-500 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Manage your products, track inventory, and update product details
          </motion.p>
        </div>

        {/* RIGHT SIDE BUTTON */}
        <Button
          onClick={() => {
            setEditingProduct(null);
            setShowUploadForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Product
        </Button>

      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            className="flex flex-col items-center justify-center h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-slate-500">Loading products...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-3 py-6">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <p className="text-red-700 font-medium">{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : showUploadForm ? (
          <UploadForm
            onClose={() => {
              setShowUploadForm(false);
              setEditingProduct(null);
            }}
            editingProduct={editingProduct}
            onSuccess={() => {
              setShowUploadForm(false);
              setEditingProduct(null);
              fetchProducts();
            }}
          />
        ) : (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4">

                  {/* Add Product Button (Top Right) */}
                  {/* <div className="flex justify-end">
      <Button
        onClick={() => {
          setEditingProduct(null);
          setShowUploadForm(true);
        }}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add New Product
      </Button>
    </div> */}

                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                {/* Filters - 1 row on mobile */}
                <div className="flex flex-col md:flex-row gap-3 mb-6 items-stretch md:items-center">

                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Filter 1 */}
                  <Select
                    value={productType || "all"}
                    onValueChange={(value) =>
                      setProductType(value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Bottle">Bottle</SelectItem>
                      <SelectItem value="Raw Material">Raw Material</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Filter 2 */}
                  <Select
                    value={selectedCategory || "all"}
                    onValueChange={(value) =>
                      setSelectedCategory(value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>

                      {productType === "Raw Material" ? (
                        <>
                          <SelectItem value="25 mm Plastic ROPP Cap">25 mm Plastic ROPP Cap</SelectItem>
                          <SelectItem value="Narrow Neck Cap">Narrow Neck Cap</SelectItem>
                          <SelectItem value="Pet Preforms">Pet Preforms</SelectItem>
                          <SelectItem value="26/22 Shortneck caps">26/22 Shortneck caps</SelectItem>
                          <SelectItem value="27mm Alaska caps">27mm Alaska caps</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="200ml">200ml</SelectItem>
                          <SelectItem value="250ml">250ml</SelectItem>
                          <SelectItem value="500ml">500ml</SelectItem>
                          <SelectItem value="700ml">700ml</SelectItem>
                          <SelectItem value="900ml">900ml</SelectItem>
                          <SelectItem value="1L">1L</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Products Grid - 2 columns mobile, 3 columns tablet, 4 columns desktop */}
                {pagedProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No products found</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                      {pagedProducts.map((product, index) => (
                        <ProductCard
                          key={product._id}
                          product={product}
                          onEdit={() => handleEditProduct(product)}
                          onDelete={() => handleDeleteClick(product)}
                          index={index}
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    {filteredProducts.length > 0 && (
                      <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-slate-500 order-2 sm:order-1">
                          Showing {startIndex + 1}–{Math.min(endIndex, filteredProducts.length)} of{" "}
                          {filteredProducts.length} products
                        </div>
                        <div className="order-1 sm:order-2">
                          <Paginator
                            page={page}
                            total={filteredProducts.length}
                            pageSize={pageSize}
                            onPageChange={setPage}
                          />
                        </div>
                        <div className="flex items-center gap-2 order-3">
                          <Label htmlFor="pageSize" className="text-sm text-slate-500">
                            Per page:
                          </Label>
                          <Select
                            value={pageSize.toString()}
                            onValueChange={(value) => {
                              setPageSize(Number(value));
                              setPage(1);
                            }}
                          >
                            <SelectTrigger className="w-[70px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="8">8</SelectItem>
                              <SelectItem value="12">12</SelectItem>
                              <SelectItem value="16">16</SelectItem>
                              <SelectItem value="24">24</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              "{productToDelete?.name}" from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

const UploadForm = ({ onClose, editingProduct, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: editingProduct?.name || "",
    type: editingProduct?.type || "Bottle",
    category: editingProduct?.category || "",
    description: editingProduct?.description || "",
    originalPrice: editingProduct?.originalPrice || "",
    discountedPrice: editingProduct?.discountedPrice || "",
    boxes: editingProduct?.boxes || "",
    bottlesPerBox: editingProduct?.bottlesPerBox || "",
    validFrom: editingProduct?.validFrom ? new Date(editingProduct.validFrom) : null,
    validTo: editingProduct?.validTo ? new Date(editingProduct.validTo) : null,
    bulkDiscountEnabled: editingProduct?.bulkDiscountEnabled || false,
    bulkDiscountMinBoxes: editingProduct?.bulkDiscountMinBoxes || "",
    bulkDiscountPrice: editingProduct?.bulkDiscountPrice || "",
  });
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getCategories = (type) => {
    if (type === "Bottle") {
      return ["200ml", "250ml", "500ml", "700ml", "900ml", "1L"];
    } else if (type === "Raw Material") {
      return [
        "25 mm Plastic ROPP Cap",
        "Narrow Neck Cap",
        "Pet Preforms",
        "26/22 Shortneck caps",
        "27mm Alaska caps",
      ];
    }
    return [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate required fields
    if (
      !formData.name ||
      !formData.type ||
      !formData.category ||
      !formData.originalPrice ||
      !formData.boxes ||
      !formData.bottlesPerBox
    ) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (Number(formData.bottlesPerBox) < 1) {
      setError("Bottles per box must be at least 1");
      setLoading(false);
      return;
    }

    if (
      formData.discountedPrice &&
      Number(formData.discountedPrice) >= Number(formData.originalPrice)
    ) {
      setError("Discounted price must be less than original price");
      setLoading(false);
      return;
    }

    if (
      formData.discountedPrice &&
      (!formData.validFrom || !formData.validTo)
    ) {
      setError("Please provide validity dates for the discount");
      setLoading(false);
      return;
    }

    if (
      formData.discountedPrice &&
      formData.validFrom &&
      formData.validTo &&
      formData.validFrom > formData.validTo
    ) {
      setError("Valid To date must be after Valid From date");
      setLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("type", formData.type);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("description", formData.description || "");
    formDataToSend.append("originalPrice", Number(formData.originalPrice));
    formDataToSend.append("boxes", Number(formData.boxes));
    formDataToSend.append("bottlesPerBox", Number(formData.bottlesPerBox));

    if (formData.bulkDiscountEnabled) {
      if (
        !formData.bulkDiscountMinBoxes ||
        !formData.bulkDiscountPrice ||
        Number(formData.bulkDiscountMinBoxes) <= 0 ||
        Number(formData.bulkDiscountPrice) >= Number(formData.originalPrice)
      ) {
        setError("Please provide valid bulk discount values");
        setLoading(false);
        return;
      }

      formDataToSend.append("bulkDiscountEnabled", true);
      formDataToSend.append("bulkDiscountMinBoxes", Number(formData.bulkDiscountMinBoxes));
      formDataToSend.append("bulkDiscountPrice", Number(formData.bulkDiscountPrice));
    }

    if (formData.discountedPrice) {
      formDataToSend.append("discountedPrice", Number(formData.discountedPrice));
    }
    if (formData.validFrom) {
      formDataToSend.append("validFrom", formData.validFrom.toISOString());
    }
    if (formData.validTo) {
      formDataToSend.append("validTo", formData.validTo.toISOString());
    }
    if (image) {
      formDataToSend.append("image", image);
    }

    try {
      const token = cookies.get("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct._id}`, formDataToSend);
      } else {
        await api.post("/admin/products", formDataToSend);
      }
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || error.message);
      console.error("Error saving product:", error);
      if (
        error.response?.status === 401 ||
        error.message === "No authentication token found"
      ) {
        cookies.remove("token");
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <Separator />
      <CardContent className="pt-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Image Upload */}
            <div className="col-span-1">
              <Label className="block mb-2">Product Image</Label>
              <div
                className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => document.getElementById("image-upload").click()}
              >
                <input
                  id="image-upload"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
                      if (!validTypes.includes(file.type) || file.size > 1024 * 1024) {
                        setError("upload valid image less than 1 mb");
                        e.target.value = "";
                        return;
                      }
                      setImage(file);
                    }
                  }}
                  accept="image/*"
                  className="hidden"
                />
                {image || editingProduct?.image ? (
                  <img
                    src={image ? URL.createObjectURL(image) : editingProduct.image}
                    alt="Preview"
                    className="max-h-40 mx-auto object-contain"
                  />
                ) : (
                  <div>
                    <Package className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Click to upload image</p>
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Product Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => {
                      setFormData({ ...formData, type: value, category: "" });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bottle">Bottle</SelectItem>
                      <SelectItem value="Raw Material">Raw Material</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category || "placeholder"}
                    onValueChange={(value) => {
                      if (value !== "placeholder") {
                        setFormData({ ...formData, category: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCategories(formData.type).map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="boxes">Number of Boxes *</Label>
                  <Input
                    id="boxes"
                    type="number"
                    value={formData.boxes}
                    onChange={(e) => setFormData({ ...formData, boxes: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bottlesPerBox">Bottles per Box * (min 1)</Label>
                  <Input
                    id="bottlesPerBox"
                    type="number"
                    value={formData.bottlesPerBox}
                    onChange={(e) => setFormData({ ...formData, bottlesPerBox: e.target.value })}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="originalPrice">Original Price per Box *</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    min="0"
                    step="any"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discountedPrice">Discounted Price per Box</Label>
                  <Input
                    id="discountedPrice"
                    type="number"
                    value={formData.discountedPrice}
                    onChange={(e) => setFormData({ ...formData, discountedPrice: e.target.value })}
                    min="0"
                    step="any"
                  />
                </div>
              </div>

              {formData.discountedPrice && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Valid From *</Label>
                    <DatePicker
                      selected={formData.validFrom}
                      onChange={(date) => setFormData({ ...formData, validFrom: date })}
                      className="w-full border border-slate-200 rounded-md px-3 py-2"
                      dateFormat="dd/MM/yyyy"
                      minDate={new Date()}
                      placeholderText="Select start date"
                    />
                  </div>
                  <div>
                    <Label>Valid To *</Label>
                    <DatePicker
                      selected={formData.validTo}
                      onChange={(date) => setFormData({ ...formData, validTo: date })}
                      className="w-full border border-slate-200 rounded-md px-3 py-2"
                      dateFormat="dd/MM/yyyy"
                      minDate={formData.validFrom || new Date()}
                      placeholderText="Select end date"
                    />
                  </div>
                </div>
              )}

              {/* Bulk Discount */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="bulkDiscount"
                  checked={formData.bulkDiscountEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, bulkDiscountEnabled: checked })}
                />
                <Label htmlFor="bulkDiscount">Enable Bulk Discount</Label>
              </div>

              {formData.bulkDiscountEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Minimum Boxes for Discount *</Label>
                    <Input
                      type="number"
                      value={formData.bulkDiscountMinBoxes}
                      onChange={(e) => setFormData({ ...formData, bulkDiscountMinBoxes: e.target.value })}
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <Label>Discounted Price per Box *</Label>
                    <Input
                      type="number"
                      value={formData.bulkDiscountPrice}
                      onChange={(e) => setFormData({ ...formData, bulkDiscountPrice: e.target.value })}
                      min="0"
                      step="any"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="description">Product Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Enter product description"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingProduct ? "Update Product" : "Save & Publish"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const ProductCard = ({ product, onEdit, onDelete, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">
        <div className="relative h-40 md:h-48 bg-slate-50">
          <img
            src={product.image || "/placeholder-image.jpg"}
            alt={product.name}
            className="w-full h-full object-contain p-3 md:p-4"
          />
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 w-7 md:h-8 md:w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 w-7 md:h-8 md:w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
          {product.discountedPrice && (
            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-xs">
              <Tag className="h-2 w-2 md:h-3 md:w-3 mr-1" />
              {Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100)}% OFF
            </Badge>
          )}
        </div>
        <CardContent className="p-3 md:p-4">
          <h4 className="font-semibold text-slate-800 truncate text-sm md:text-base mb-1">{product.name}</h4>
          <p className="text-xs md:text-sm text-slate-500 truncate mb-2 md:mb-3">{product.description || "No description"}</p>

          <div className="space-y-1.5 md:space-y-2">
            <div className="flex justify-between items-center text-xs md:text-sm">
              <span className="text-slate-500">Original Price:</span>
              <span className="font-semibold text-slate-800">₹{product.originalPrice}/box</span>
            </div>
            {product.discountedPrice && (
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-slate-500">Discounted Price:</span>
                <span className="font-semibold text-green-600">₹{product.discountedPrice}/box</span>
              </div>
            )}
            <Separator className="my-1 md:my-2" />
            <div className="flex justify-between items-center text-xs md:text-sm">
              <span className="text-slate-500">Type:</span>
              <Badge variant="outline" className="text-xs">{product.type}</Badge>
            </div>
            <div className="flex justify-between items-center text-xs md:text-sm">
              <span className="text-slate-500">Category:</span>
              <span className="text-slate-700 text-xs md:text-sm truncate max-w-[120px] md:max-w-none">{product.category}</span>
            </div>
            <div className="flex justify-between items-center text-xs md:text-sm">
              <span className="text-slate-500">Stock:</span>
              <span className="font-medium text-slate-800">{product.boxes} boxes</span>
            </div>
          </div>

          {product.bulkDiscountEnabled && (
            <div className="mt-2 md:mt-3 p-2 bg-blue-50 rounded-md">
              <div className="flex items-center gap-1 text-xs text-blue-700 mb-1">
                <TrendingUp className="h-2 w-2 md:h-3 md:w-3" />
                <span className="font-medium text-xs">Bulk Discount</span>
              </div>
              <p className="text-xs text-blue-600">
                ₹{product.bulkDiscountPrice}/box for {product.bulkDiscountMinBoxes}+ boxes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Product;
