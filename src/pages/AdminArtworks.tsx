
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/config';

interface Artwork {
  id: string;
  title: string;
  artist: string;
  description: string;
  price: number;
  image_url: string;
  dimensions: string;
  medium: string;
  year: number;
  status: 'available' | 'sold';
}

const AdminArtworks = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [title, setTitle] = useState<string>('');
  const [artist, setArtist] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<string>('');
  const [medium, setMedium] = useState<string>('');
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentArtworkId, setCurrentArtworkId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin-login');
      return;
    }
    
    fetchArtworks();
  }, [navigate]);
  
  const fetchArtworks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/artworks`);
      const data = await response.json();
      
      if (data.artworks) {
        setArtworks(data.artworks);
      } else {
        setArtworks([]);
      }
    } catch (error) {
      console.error('Error fetching artworks:', error);
      toast({
        title: "Error",
        description: "Failed to load artworks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !artist || !description || !price || !imageFile || !dimensions || !medium || !year) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields and upload an image.",
        variant: "destructive",
      });
      return;
    }
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin-login');
      return;
    }
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('image', imageFile);
    formData.append('dimensions', dimensions);
    formData.append('medium', medium);
    formData.append('year', year);
    formData.append('status', 'available');
    
    try {
      setLoading(true);
      
      const url = editMode && currentArtworkId 
        ? `${API_URL}/artworks/${currentArtworkId}` 
        : `${API_URL}/artworks`;
        
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Reset form
      resetForm();
      
      // Refresh artwork list
      fetchArtworks();
      
      toast({
        title: "Success",
        description: editMode ? "Artwork updated successfully" : "Artwork added successfully",
      });
      
    } catch (error) {
      console.error('Error submitting artwork:', error);
      toast({
        title: "Error",
        description: `Failed to ${editMode ? 'update' : 'add'} artwork. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (artwork: Artwork) => {
    setTitle(artwork.title);
    setArtist(artwork.artist);
    setDescription(artwork.description);
    setPrice(artwork.price.toString());
    setImagePreview(artwork.image_url);
    setDimensions(artwork.dimensions || '');
    setMedium(artwork.medium || '');
    setYear(artwork.year?.toString() || new Date().getFullYear().toString());
    setEditMode(true);
    setCurrentArtworkId(artwork.id);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this artwork?')) {
      return;
    }
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin-login');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/artworks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Refresh artwork list
      fetchArtworks();
      
      toast({
        title: "Success",
        description: "Artwork deleted successfully",
      });
      
    } catch (error) {
      console.error('Error deleting artwork:', error);
      toast({
        title: "Error",
        description: "Failed to delete artwork. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setArtist('');
    setDescription('');
    setPrice('');
    setImageFile(null);
    setImagePreview(null);
    setDimensions('');
    setMedium('');
    setYear(new Date().getFullYear().toString());
    setEditMode(false);
    setCurrentArtworkId(null);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manage Artworks</h1>
      
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">{editMode ? 'Edit Artwork' : 'Add New Artwork'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="title">Title</label>
              <Input 
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter artwork title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="artist">Artist</label>
              <Input 
                id="artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Enter artist name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="price">Price (KSh)</label>
              <Input 
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="year">Year</label>
              <Input 
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Enter year"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="dimensions">Dimensions</label>
              <Input 
                id="dimensions"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="e.g. 24 x 36 inches"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="medium">Medium</label>
              <Input 
                id="medium"
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                placeholder="e.g. Oil on canvas"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" htmlFor="image">Artwork Image</label>
              <Input 
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mb-2"
              />
              {imagePreview && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">Preview:</p>
                  <img 
                    src={imagePreview} 
                    alt="Artwork preview" 
                    className="max-h-40 max-w-full object-contain border rounded"
                  />
                </div>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" htmlFor="description">Description</label>
              <Textarea 
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter artwork description"
                rows={4}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            {editMode && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editMode ? 'Update Artwork' : 'Add Artwork'}
            </Button>
          </div>
        </form>
      </Card>
      
      <h2 className="text-xl font-semibold mb-4">All Artworks</h2>
      
      {loading ? (
        <p className="text-center py-4">Loading artworks...</p>
      ) : artworks.length === 0 ? (
        <p className="text-center py-4">No artworks found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artworks.map((artwork) => (
            <Card key={artwork.id} className="overflow-hidden">
              <img 
                src={artwork.image_url} 
                alt={artwork.title} 
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold">{artwork.title}</h3>
                <p className="text-gray-600">By {artwork.artist}</p>
                <p className="font-medium mt-2">KSh {artwork.price.toLocaleString()}</p>
                <p className="text-sm mt-1">Status: {artwork.status}</p>
                
                <div className="flex justify-end space-x-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(artwork)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(artwork.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminArtworks;
