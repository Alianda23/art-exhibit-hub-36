
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/config';

interface Exhibition {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  ticketPrice: number;
  imageUrl: string;
  totalSlots: number;
  availableSlots: number;
  status: 'upcoming' | 'ongoing' | 'past';
}

const AdminExhibitions = () => {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [ticketPrice, setTicketPrice] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [totalSlots, setTotalSlots] = useState<string>('');
  const [status, setStatus] = useState<'upcoming' | 'ongoing' | 'past'>('upcoming');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentExhibitionId, setCurrentExhibitionId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin-login');
      return;
    }
    
    fetchExhibitions();
  }, [navigate]);
  
  const fetchExhibitions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/exhibitions`);
      const data = await response.json();
      
      if (data.exhibitions) {
        setExhibitions(data.exhibitions);
      } else {
        setExhibitions([]);
      }
    } catch (error) {
      console.error('Error fetching exhibitions:', error);
      toast({
        title: "Error",
        description: "Failed to load exhibitions. Please try again.",
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
    
    if (!title || !description || !location || !startDate || !endDate || !ticketPrice || !totalSlots) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (!editMode && !imageFile) {
      toast({
        title: "Validation Error",
        description: "Please upload an image for the exhibition.",
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
    formData.append('description', description);
    formData.append('location', location);
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    formData.append('ticketPrice', ticketPrice);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    formData.append('totalSlots', totalSlots);
    formData.append('availableSlots', totalSlots); // For new exhibitions, available = total
    formData.append('status', status);
    
    try {
      setLoading(true);
      
      const url = editMode && currentExhibitionId 
        ? `${API_URL}/exhibitions/${currentExhibitionId}` 
        : `${API_URL}/exhibitions`;
        
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
      
      // Refresh exhibition list
      fetchExhibitions();
      
      toast({
        title: "Success",
        description: editMode ? "Exhibition updated successfully" : "Exhibition added successfully",
      });
      
    } catch (error) {
      console.error('Error submitting exhibition:', error);
      toast({
        title: "Error",
        description: `Failed to ${editMode ? 'update' : 'add'} exhibition. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (exhibition: Exhibition) => {
    setTitle(exhibition.title);
    setDescription(exhibition.description);
    setLocation(exhibition.location);
    setStartDate(exhibition.startDate);
    setEndDate(exhibition.endDate);
    setTicketPrice(exhibition.ticketPrice.toString());
    setImagePreview(exhibition.imageUrl);
    setTotalSlots(exhibition.totalSlots.toString());
    setStatus(exhibition.status);
    setEditMode(true);
    setCurrentExhibitionId(exhibition.id);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this exhibition?')) {
      return;
    }
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin-login');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/exhibitions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Refresh exhibition list
      fetchExhibitions();
      
      toast({
        title: "Success",
        description: "Exhibition deleted successfully",
      });
      
    } catch (error) {
      console.error('Error deleting exhibition:', error);
      toast({
        title: "Error",
        description: "Failed to delete exhibition. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setStartDate('');
    setEndDate('');
    setTicketPrice('');
    setImageFile(null);
    setImagePreview(null);
    setTotalSlots('');
    setStatus('upcoming');
    setEditMode(false);
    setCurrentExhibitionId(null);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manage Exhibitions</h1>
      
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">{editMode ? 'Edit Exhibition' : 'Add New Exhibition'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="title">Title</label>
              <Input 
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter exhibition title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="location">Location</label>
              <Input 
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter exhibition location"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="startDate">Start Date</label>
              <Input 
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="endDate">End Date</label>
              <Input 
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="ticketPrice">Ticket Price (KSh)</label>
              <Input 
                id="ticketPrice"
                type="number"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                placeholder="Enter ticket price"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="totalSlots">Total Slots</label>
              <Input 
                id="totalSlots"
                type="number"
                value={totalSlots}
                onChange={(e) => setTotalSlots(e.target.value)}
                placeholder="Enter total available slots"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="status">Status</label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" htmlFor="image">Exhibition Image</label>
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
                    alt="Exhibition preview" 
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
                placeholder="Enter exhibition description"
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
              {loading ? 'Saving...' : editMode ? 'Update Exhibition' : 'Add Exhibition'}
            </Button>
          </div>
        </form>
      </Card>
      
      <h2 className="text-xl font-semibold mb-4">All Exhibitions</h2>
      
      {loading ? (
        <p className="text-center py-4">Loading exhibitions...</p>
      ) : exhibitions.length === 0 ? (
        <p className="text-center py-4">No exhibitions found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exhibitions.map((exhibition) => (
            <Card key={exhibition.id} className="overflow-hidden">
              <img 
                src={exhibition.imageUrl} 
                alt={exhibition.title} 
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold">{exhibition.title}</h3>
                <p className="text-sm text-gray-600">{exhibition.location}</p>
                <p className="text-sm mt-1">
                  {new Date(exhibition.startDate).toLocaleDateString()} to {new Date(exhibition.endDate).toLocaleDateString()}
                </p>
                <p className="font-medium mt-2">KSh {exhibition.ticketPrice.toLocaleString()}</p>
                <p className="text-sm mt-1">
                  Slots: {exhibition.availableSlots} available / {exhibition.totalSlots} total
                </p>
                <p className="text-sm mt-1 capitalize">Status: {exhibition.status}</p>
                
                <div className="flex justify-end space-x-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(exhibition)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(exhibition.id)}>
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

export default AdminExhibitions;
