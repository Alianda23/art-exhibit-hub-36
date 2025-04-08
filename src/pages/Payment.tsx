
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { API_URL } from '@/config';

interface PaymentProps {}

const Payment: React.FC<PaymentProps> = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get order information from state
  const orderInfo = location.state?.orderInfo;
  
  useEffect(() => {
    if (!orderInfo) {
      toast({
        title: "Error",
        description: "No order information found. Please try again.",
        variant: "destructive",
      });
      navigate(-1);
    }
  }, [orderInfo, navigate, toast]);
  
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please enter your phone number.",
        variant: "destructive",
      });
      return;
    }
    
    // Format phone number
    let formattedPhone = phoneNumber;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }
    
    setIsProcessing(true);
    
    try {
      const userId = localStorage.getItem('userId') || '0';
      
      // Prepare payment data
      const paymentData = {
        phoneNumber: formattedPhone,
        amount: orderInfo.amount,
        accountReference: `${orderInfo.type} Payment`,
        orderType: orderInfo.type, // 'artwork' or 'exhibition'
        orderId: orderInfo.id,
        userId: userId
      };
      
      console.log('Sending payment request:', paymentData);
      
      // Send STK push request
      const response = await fetch(`${API_URL}/mpesa/stk-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      console.log('Payment response:', data);
      
      if (data.success) {
        setTransactionId(data.checkoutRequestId);
        
        toast({
          title: "STK Push Sent",
          description: "Please check your phone and enter M-PESA PIN to complete payment.",
        });
        
        // Start checking payment status
        setTimeout(() => {
          checkPaymentStatus(data.checkoutRequestId);
        }, 10000); // Check after 10 seconds
      } else {
        throw new Error(data.responseDescription || 'Failed to initiate payment');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };
  
  const checkPaymentStatus = async (checkoutRequestId: string) => {
    if (!checkoutRequestId) return;
    
    setIsChecking(true);
    
    // For development, simulate a successful payment
    setTimeout(() => {
      // Redirect to success page
      navigate('/payment/success', { 
        state: { 
          orderInfo: orderInfo,
          transactionId: checkoutRequestId
        } 
      });
      setIsChecking(false);
    }, 5000);
    
    // In production, you would check the actual status:
    /*
    try {
      const response = await fetch(`${API_URL}/mpesa/status?checkoutRequestId=${checkoutRequestId}`);
      const data = await response.json();
      
      if (data.status === 'completed') {
        // Payment successful
        navigate('/payment/success', { 
          state: { 
            orderInfo: orderInfo,
            transactionId: checkoutRequestId
          } 
        });
      } else if (data.status === 'failed') {
        // Payment failed
        toast({
          title: "Payment Failed",
          description: data.message || "Your payment could not be processed. Please try again.",
          variant: "destructive",
        });
        setIsProcessing(false);
        setIsChecking(false);
      } else {
        // Still pending, check again after a delay
        setTimeout(() => {
          checkPaymentStatus(checkoutRequestId);
        }, 5000);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setIsChecking(false);
    }
    */
  };
  
  if (!orderInfo) {
    return null;
  }
  
  return (
    <div className="container mx-auto max-w-md px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Complete Your Payment</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Order Summary</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="mb-2">
              <span className="font-medium">Item:</span> {orderInfo.title}
            </p>
            <p className="mb-2">
              <span className="font-medium">Type:</span> {orderInfo.type === 'artwork' ? 'Artwork Purchase' : 'Exhibition Booking'}
            </p>
            {orderInfo.type === 'exhibition' && (
              <p className="mb-2">
                <span className="font-medium">Slots:</span> {orderInfo.slots}
              </p>
            )}
            <p className="text-lg font-bold mt-2">
              <span className="font-medium">Total Amount:</span> KSh {orderInfo.amount.toLocaleString()}
            </p>
          </div>
        </div>
        
        {!transactionId ? (
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                M-PESA Phone Number
              </label>
              <Input
                id="phone"
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 07XXXXXXXX or 254XXXXXXXXX"
                required
                disabled={isProcessing}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the phone number registered with M-PESA
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Pay with M-PESA'}
            </Button>
            
            <p className="text-xs text-center text-gray-500 mt-2">
              You will receive an STK push notification on your phone to confirm the payment
            </p>
          </form>
        ) : (
          <div className="text-center">
            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
              <p className="font-medium">M-PESA request sent to your phone!</p>
              <p className="text-sm mt-1">Please enter your M-PESA PIN when prompted</p>
            </div>
            
            {isChecking ? (
              <div className="mt-6">
                <p className="mb-2">Checking payment status...</p>
                <div className="w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <Button 
                className="mt-4" 
                variant="outline" 
                onClick={() => checkPaymentStatus(transactionId)}
              >
                Check Payment Status
              </Button>
            )}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            disabled={isProcessing || isChecking}
          >
            Cancel Payment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Payment;
