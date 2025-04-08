
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ShoppingBag, Ticket, Image, Calendar } from 'lucide-react';

const Admin = () => {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Artworks Management */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
            <CardTitle className="flex items-center">
              <Image className="mr-2 h-6 w-6" />
              Artworks
            </CardTitle>
            <CardDescription className="text-white text-opacity-80">
              Manage gallery artworks
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-6">
              Add, edit, and delete artworks displayed in the gallery.
            </p>
          </CardContent>
          <CardFooter className="bg-gray-50 px-6 py-4">
            <Button asChild className="w-full">
              <Link to="/admin/artworks">Manage Artworks</Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Exhibitions Management */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-6 w-6" />
              Exhibitions
            </CardTitle>
            <CardDescription className="text-white text-opacity-80">
              Manage gallery exhibitions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-6">
              Create and manage upcoming, ongoing, and past exhibitions.
            </p>
          </CardContent>
          <CardFooter className="bg-gray-50 px-6 py-4">
            <Button asChild className="w-full">
              <Link to="/admin/exhibitions">Manage Exhibitions</Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Messages Management */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-6 w-6" />
              Messages
            </CardTitle>
            <CardDescription className="text-white text-opacity-80">
              Manage contact form submissions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-6">
              View and respond to messages from users who have contacted the gallery.
            </p>
          </CardContent>
          <CardFooter className="bg-gray-50 px-6 py-4">
            <Button asChild className="w-full">
              <Link to="/admin/messages">Manage Messages</Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Ticket Management */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
            <CardTitle className="flex items-center">
              <Ticket className="mr-2 h-6 w-6" />
              Tickets
            </CardTitle>
            <CardDescription className="text-white text-opacity-80">
              Manage exhibition tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-6">
              View all exhibition bookings and print tickets for users.
            </p>
          </CardContent>
          <CardFooter className="bg-gray-50 px-6 py-4">
            <Button asChild className="w-full">
              <Link to="/admin/tickets">Manage Tickets</Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Orders Management */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-red-500 text-white">
            <CardTitle className="flex items-center">
              <ShoppingBag className="mr-2 h-6 w-6" />
              Orders
            </CardTitle>
            <CardDescription className="text-white text-opacity-80">
              Manage artwork purchase orders
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-6">
              View and manage artwork orders placed by customers.
            </p>
          </CardContent>
          <CardFooter className="bg-gray-50 px-6 py-4">
            <Button asChild className="w-full">
              <Link to="/admin/orders">Manage Orders</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
