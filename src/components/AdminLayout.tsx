
import React, { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const { logout, currentUser, isAuthenticated, isAdmin } = useAuth();
  
  useEffect(() => {
    // Check if logged in and is admin
    const token = localStorage.getItem('token');
    const adminStatus = localStorage.getItem('isAdmin');
    
    console.log("Admin verification in AdminLayout:", { 
      isAuthenticatedContext: isAuthenticated,
      isAdminContext: isAdmin,
      currentUser,
      localStorageToken: token ? (token.substring(0, 20) + '...') : null,
      localStorageIsAdmin: adminStatus
    });
    
    if (!token || adminStatus !== 'true') {
      // Only show toast and redirect if there's no valid admin session
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access admin features",
          variant: "destructive"
        });
      } else if (adminStatus !== 'true') {
        toast({
          title: "Access Denied",
          description: "You need admin privileges to access this area",
          variant: "destructive"
        });
      }
      navigate('/admin-login');
      return;
    }
  }, [navigate, isAuthenticated, isAdmin]);
  
  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };
  
  const userInitials = currentUser?.name 
    ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'A';
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Admin header - simplified with just profile */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <div className="text-lg font-semibold">Admin Dashboard</div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 mr-2">
              {currentUser?.name || 'Admin User'} 
              {currentUser?.isAdmin ? ' (Admin)' : ''}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/admin')}>
                  <User className="w-4 h-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
