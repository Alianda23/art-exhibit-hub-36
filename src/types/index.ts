
// User types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string; // Adding phone property as optional
  isAdmin?: boolean;
}

// Artwork types
export interface Artwork {
  id?: string;
  title: string;
  artist: string;
  description: string;
  price: number;
  imageUrl: string;
  dimensions?: string;
  medium?: string;
  year?: number;
  status: 'available' | 'sold';
  size?: string; // Adding this field to avoid errors
}

// Exhibition types
export interface Exhibition {
  id?: string;
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

// Contact message types
export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: string;
}

// Order types
export interface Order {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'artwork' | 'exhibition';
  quantity: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
}

// Ticket types
export interface Ticket {
  id: string;
  orderId: string;
  userId: string;
  exhibitionId: string;
  ticketCode: string;
  status: 'valid' | 'used' | 'cancelled';
  createdAt: string;
}
