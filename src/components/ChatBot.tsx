
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageCircle, Send, X, ChevronDown, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendWhatsAppMessage } from '@/services/whatsapp';

type Message = {
  id: number;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

// FAQ database - can be expanded as needed
const faqs = [
  {
    question: "What are your opening hours?",
    answer: "Our gallery is open Monday - Friday: 9:00 AM - 6:00 PM, Saturday: 10:00 AM - 5:00 PM, and Sunday: 11:00 AM - 4:00 PM."
  },
  {
    question: "How can I buy artwork?",
    answer: "You can purchase artwork directly from our website by viewing the artwork details and clicking the 'Buy Now' button. We accept various payment methods including M-Pesa."
  },
  {
    question: "Do you ship internationally?",
    answer: "Yes, we ship artwork internationally. Shipping costs depend on the destination and the size of the artwork. Please contact us for a shipping quote."
  },
  {
    question: "Can I visit your gallery in person?",
    answer: "Yes, our physical gallery is located at Kimathi Street, Nairobi, Kenya. We welcome visitors during our opening hours."
  },
  {
    question: "How do I book for an exhibition?",
    answer: "You can book tickets for our exhibitions through our website by navigating to the Exhibitions page, selecting your preferred exhibition, and clicking 'Book Now'."
  }
];

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [needsContactInfo, setNeedsContactInfo] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      // Add welcome message when chat is first opened
      setMessages([
        {
          id: 1,
          content: "Hello! Welcome to ArtExhibit. How can I help you today? You can ask me about our exhibitions, artwork, or anything else.",
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }
  };
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const findFAQAnswer = (question: string): string | null => {
    // Convert input to lowercase for case-insensitive matching
    const normalizedInput = question.toLowerCase();
    
    // Check if any FAQ keywords match
    for (const faq of faqs) {
      if (normalizedInput.includes(faq.question.toLowerCase()) || 
          // Check for keywords
          normalizedInput.includes('hours') && faq.question.includes('opening hours') ||
          normalizedInput.includes('buy') && faq.question.includes('buy artwork') ||
          normalizedInput.includes('purchase') && faq.question.includes('buy artwork') ||
          normalizedInput.includes('ship') && faq.question.includes('ship') ||
          (normalizedInput.includes('visit') || normalizedInput.includes('gallery')) && faq.question.includes('visit your gallery') ||
          (normalizedInput.includes('book') || normalizedInput.includes('exhibition')) && faq.question.includes('book for an exhibition')
      ) {
        return faq.answer;
      }
    }
    return null;
  };
  
  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    // Add user message
    const userMessageId = Date.now();
    const userMessage: Message = {
      id: userMessageId,
      content: currentMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    
    // Find if there's a matching FAQ
    const faqAnswer = findFAQAnswer(currentMessage);
    
    setTimeout(() => {
      if (faqAnswer) {
        // If FAQ match found, send the answer
        setMessages(prev => [...prev, {
          id: userMessageId + 1,
          content: faqAnswer,
          sender: 'bot',
          timestamp: new Date()
        }]);
      } else {
        // If no FAQ match, ask for contact info
        setMessages(prev => [...prev, {
          id: userMessageId + 1,
          content: "I don't have an immediate answer to your question. Please provide your contact details so our team can get back to you promptly.",
          sender: 'bot',
          timestamp: new Date()
        }]);
        setNeedsContactInfo(true);
      }
    }, 1000);
  };
  
  const handleContactInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!contactInfo.name || !contactInfo.email || !contactInfo.phone || !contactInfo.message) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    // Create message for WhatsApp
    const whatsappMessage = `
New customer inquiry:
Name: ${contactInfo.name}
Email: ${contactInfo.email}
Phone: ${contactInfo.phone}
Message: ${contactInfo.message}
    `;
    
    try {
      // Send to WhatsApp
      await sendWhatsAppMessage(whatsappMessage);
      
      // Add confirmation message
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: "Thank you! Your information has been sent to our team. We'll get back to you as soon as possible via WhatsApp (+254741080177) or email.",
        sender: 'bot',
        timestamp: new Date()
      }]);
      
      // Reset form
      setContactInfo({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
      
      setNeedsContactInfo(false);
    } catch (error) {
      console.error("Failed to send message to WhatsApp:", error);
      toast({
        title: "Error",
        description: "Failed to send your message. Please try again later.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <>
      {/* Chat Button */}
      <button 
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-gold text-white p-4 rounded-full shadow-lg hover:bg-gold-dark z-50"
        aria-label="Open Chat"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
      
      {/* Chat Window */}
      {isOpen && (
        <Card className={`fixed bottom-20 right-6 w-80 sm:w-96 shadow-xl z-50 flex flex-col transition-all duration-300 ease-in-out ${isExpanded ? 'h-[80vh]' : 'h-[60vh]'}`}>
          {/* Chat Header */}
          <div className="bg-gold text-white p-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <h3 className="font-medium">ArtExhibit Chat Support</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={toggleExpand} className="text-white hover:text-gray-200">
                <ChevronDown className={`h-5 w-5 transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-white">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`mb-4 max-w-[80%] ${message.sender === 'user' ? 'ml-auto' : 'mr-auto'}`}
              >
                <div 
                  className={`p-3 rounded-lg ${
                    message.sender === 'user' 
                      ? 'bg-gold text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {message.content}
                </div>
                <div 
                  className={`text-xs mt-1 text-gray-500 ${
                    message.sender === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            
            {/* Contact Form when needed */}
            {needsContactInfo && (
              <form onSubmit={handleContactInfoSubmit} className="bg-gray-50 p-4 rounded-lg mt-4">
                <h4 className="font-medium text-gray-800 mb-3">Please provide your contact information:</h4>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      value={contactInfo.name} 
                      onChange={(e) => setContactInfo({...contactInfo, name: e.target.value})}
                      placeholder="Your name" 
                      required 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={contactInfo.email} 
                      onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                      placeholder="Your email" 
                      required 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={contactInfo.phone} 
                      onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                      placeholder="+254..." 
                      required 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Your Question/Message</Label>
                    <Textarea 
                      id="message" 
                      value={contactInfo.message} 
                      onChange={(e) => setContactInfo({...contactInfo, message: e.target.value})}
                      placeholder="Please provide more details about your inquiry" 
                      rows={3}
                      required 
                    />
                  </div>
                  
                  <Button type="submit" className="w-full bg-gold hover:bg-gold-dark">
                    Submit
                  </Button>
                </div>
              </form>
            )}
          </div>
          
          {/* Chat Input */}
          {!needsContactInfo && (
            <div className="p-3 border-t">
              <div className="flex items-center space-x-2">
                <Input 
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage} 
                  size="icon"
                  className="bg-gold hover:bg-gold-dark"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </>
  );
};

export default ChatBot;
