
import os
import json
import http.server
import socketserver
import urllib.parse
from http import HTTPStatus
from datetime import datetime
from urllib.parse import parse_qs, urlparse
import cgi
import uuid
import base64
from io import BytesIO

# Import modules
from auth import register_user, login_user, login_admin
from artwork import get_all_artworks, get_artwork, create_artwork, update_artwork, delete_artwork
from exhibition import get_all_exhibitions, get_exhibition, create_exhibition, update_exhibition, delete_exhibition
from contact import create_contact_message, get_all_contact_messages, update_message_status
from database import initialize_database, json_dumps
from middleware import auth_required, admin_required, extract_auth_token, verify_token

# Create uploads directory if it doesn't exist
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '../public/uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Define the port
PORT = 8000

class RequestHandler(http.server.BaseHTTPRequestHandler):
    
    def _set_response(self, status_code=200, content_type='application/json'):
        self.send_response(status_code)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def do_OPTIONS(self):
        self._set_response()
    
    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        
        # Serve uploaded files
        if path.startswith('/uploads/'):
            file_path = os.path.join(os.path.dirname(__file__), '..', 'public', path[1:])
            if os.path.exists(file_path):
                # Determine content type based on file extension
                _, ext = os.path.splitext(file_path)
                content_type = 'image/jpeg'  # Default
                if ext.lower() == '.png':
                    content_type = 'image/png'
                elif ext.lower() == '.gif':
                    content_type = 'image/gif'
                
                with open(file_path, 'rb') as file:
                    self.send_response(200)
                    self.send_header('Content-type', content_type)
                    self.end_headers()
                    self.wfile.write(file.read())
                return
            else:
                self._set_response(404)
                self.wfile.write(json_dumps({"error": "File not found"}).encode())
                return
        
        # Handle GET /artworks
        elif path == '/artworks':
            response = get_all_artworks()
            self._set_response()
            self.wfile.write(json_dumps(response).encode())
            return
        
        # Handle GET /artworks/{id}
        elif path.startswith('/artworks/') and len(path.split('/')) == 3:
            artwork_id = path.split('/')[2]
            response = get_artwork(artwork_id)
            self._set_response()
            self.wfile.write(json_dumps(response).encode())
            return
        
        # Handle GET /exhibitions
        elif path == '/exhibitions':
            response = get_all_exhibitions()
            self._set_response()
            self.wfile.write(json_dumps(response).encode())
            return
        
        # Handle GET /exhibitions/{id}
        elif path.startswith('/exhibitions/') and len(path.split('/')) == 3:
            exhibition_id = path.split('/')[2]
            response = get_exhibition(exhibition_id)
            self._set_response()
            self.wfile.write(json_dumps(response).encode())
            return
        
        # Handle GET /messages (admin only)
        elif path == '/messages':
            token = extract_auth_token(self)
            if not token:
                self._set_response(401)
                self.wfile.write(json_dumps({"error": "Authentication required"}).encode())
                return
            
            payload = verify_token(token)
            if isinstance(payload, dict) and "error" in payload:
                self._set_response(401)
                self.wfile.write(json_dumps({"error": payload["error"]}).encode())
                return
            
            # Check if user is admin
            if not payload.get("is_admin", False):
                self._set_response(403)
                self.wfile.write(json_dumps({"error": "Unauthorized access: Admin privileges required"}).encode())
                return
            
            response = get_all_contact_messages()
            self._set_response()
            self.wfile.write(json_dumps(response).encode())
            return
        
        # Default 404 response
        self._set_response(404)
        self.wfile.write(json_dumps({"error": "Resource not found"}).encode())
    
    def do_POST(self):
        path = self.path
        
        # Parse form data (for multipart/form-data)
        if "multipart/form-data" in self.headers.get('Content-Type', ''):
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={
                    'REQUEST_METHOD': 'POST',
                    'CONTENT_TYPE': self.headers['Content-Type'],
                }
            )
            
            # Create artwork with file upload (admin only)
            if path == '/artworks':
                auth_header = self.headers.get('Authorization', '')
                
                # Check if admin is authenticated
                token = extract_auth_token(self)
                if not token:
                    self._set_response(401)
                    self.wfile.write(json_dumps({"error": "Authentication required"}).encode())
                    return
                
                payload = verify_token(token)
                if isinstance(payload, dict) and "error" in payload:
                    self._set_response(401)
                    self.wfile.write(json_dumps({"error": payload["error"]}).encode())
                    return
                
                # Check if user is admin
                if not payload.get("is_admin", False):
                    self._set_response(403)
                    self.wfile.write(json_dumps({"error": "Unauthorized access: Admin privileges required"}).encode())
                    return
                
                # Process form data
                post_data = {}
                for field in form.keys():
                    if field != 'image':
                        post_data[field] = form[field].value
                
                # Process image upload
                if 'image' in form:
                    fileitem = form['image']
                    if fileitem.filename:
                        # Generate unique filename
                        filename = f"{uuid.uuid4()}{os.path.splitext(fileitem.filename)[1]}"
                        filepath = os.path.join(UPLOAD_DIR, filename)
                        
                        # Save file
                        with open(filepath, 'wb') as f:
                            f.write(fileitem.file.read())
                        
                        # Update image_url in post_data
                        post_data['imageUrl'] = f"/uploads/{filename}"
                
                # Create artwork
                response = create_artwork(auth_header, post_data)
                
                if "error" in response:
                    self._set_response(400)
                else:
                    self._set_response(201)
                
                self.wfile.write(json_dumps(response).encode())
                return
            
            # Create exhibition with file upload (admin only)
            elif path == '/exhibitions':
                auth_header = self.headers.get('Authorization', '')
                
                # Check if admin is authenticated
                token = extract_auth_token(self)
                if not token:
                    self._set_response(401)
                    self.wfile.write(json_dumps({"error": "Authentication required"}).encode())
                    return
                
                payload = verify_token(token)
                if isinstance(payload, dict) and "error" in payload:
                    self._set_response(401)
                    self.wfile.write(json_dumps({"error": payload["error"]}).encode())
                    return
                
                # Check if user is admin
                if not payload.get("is_admin", False):
                    self._set_response(403)
                    self.wfile.write(json_dumps({"error": "Unauthorized access: Admin privileges required"}).encode())
                    return
                
                # Process form data
                post_data = {}
                for field in form.keys():
                    if field != 'image':
                        post_data[field] = form[field].value
                
                # Process image upload
                if 'image' in form:
                    fileitem = form['image']
                    if fileitem.filename:
                        # Generate unique filename
                        filename = f"{uuid.uuid4()}{os.path.splitext(fileitem.filename)[1]}"
                        filepath = os.path.join(UPLOAD_DIR, filename)
                        
                        # Save file
                        with open(filepath, 'wb') as f:
                            f.write(fileitem.file.read())
                        
                        # Update imageUrl in post_data
                        post_data['imageUrl'] = f"/uploads/{filename}"
                
                # Create exhibition
                response = create_exhibition(auth_header, post_data)
                
                if "error" in response:
                    self._set_response(400)
                else:
                    self._set_response(201)
                
                self.wfile.write(json_dumps(response).encode())
                return
        
        # Get content length for regular JSON data
        content_length = int(self.headers.get('Content-Length', 0))
        
        # Parse JSON data
        post_data = {}
        if content_length > 0 and "application/json" in self.headers.get('Content-Type', ''):
            post_data = json.loads(self.rfile.read(content_length).decode('utf-8'))
        
        # Register user
        if path == '/register':
            if not post_data:
                self._set_response(400)
                self.wfile.write(json_dumps({"error": "Missing registration data"}).encode())
                return
            
            print(f"Registration data: {post_data}")
            
            # Check required fields
            required_fields = ['name', 'email', 'password']
            missing_fields = [field for field in required_fields if field not in post_data]
            
            if missing_fields:
                self._set_response(400)
                self.wfile.write(json_dumps({"error": f"Missing required fields: {', '.join(missing_fields)}"}).encode())
                return
            
            # Register the user
            response = register_user(
                post_data['name'], 
                post_data['email'], 
                post_data['password'],
                post_data.get('phone', '')  # Optional field
            )
            
            if "error" in response:
                self._set_response(400)
            else:
                self._set_response(201)
            
            self.wfile.write(json_dumps(response).encode())
            return
        
        # User login
        elif path == '/login':
            if not post_data:
                self._set_response(400)
                self.wfile.write(json_dumps({"error": "Missing login data"}).encode())
                return
            
            # Check required fields
            if 'email' not in post_data or 'password' not in post_data:
                self._set_response(400)
                self.wfile.write(json_dumps({"error": "Email and password required"}).encode())
                return
            
            # Login the user
            response = login_user(post_data['email'], post_data['password'])
            
            if "error" in response:
                self._set_response(401)
                self.wfile.write(json_dumps(response).encode())
                return
            
            self._set_response(200)
            self.wfile.write(json_dumps(response).encode())
            return
        
        # Admin login
        elif path == '/admin/login':
            if not post_data:
                self._set_response(400)
                self.wfile.write(json_dumps({"error": "Missing login data"}).encode())
                return
            
            # Check required fields
            if 'email' not in post_data or 'password' not in post_data:
                self._set_response(400)
                self.wfile.write(json_dumps({"error": "Email and password required"}).encode())
                return
            
            # Login as admin
            response = login_admin(post_data['email'], post_data['password'])
            
            if "error" in response:
                self._set_response(401)
                self.wfile.write(json_dumps(response).encode())
                return
            
            self._set_response(200)
            self.wfile.write(json_dumps(response).encode())
            return
        
        # Create contact message
        elif path == '/contact':
            # Check required fields
            required_fields = ['name', 'email', 'message']
            missing_fields = [field for field in required_fields if field not in post_data]
            
            if missing_fields:
                self._set_response(400)
                self.wfile.write(json_dumps({"error": f"Missing required fields: {', '.join(missing_fields)}"}).encode())
                return
            
            response = create_contact_message(post_data)
            
            if "error" in response:
                self._set_response(400)
            else:
                self._set_response(201)
            
            self.wfile.write(json_dumps(response).encode())
            return
        
        # STK Push for M-Pesa payment
        elif path == '/mpesa/stk-push':
            # Check required fields
            required_fields = ['phoneNumber', 'amount', 'accountReference', 'orderType', 'orderId', 'userId']
            missing_fields = [field for field in required_fields if field not in post_data]
            
            if missing_fields:
                self._set_response(400)
                self.wfile.write(json_dumps({"error": f"Missing required fields: {', '.join(missing_fields)}"}).encode())
                return
            
            # Process STK Push (simulate success for development)
            checkout_request_id = str(uuid.uuid4())
            merchant_request_id = str(uuid.uuid4())
            
            # Simulate a successful response
            response = {
                "success": True,
                "checkoutRequestId": checkout_request_id,
                "merchantRequestId": merchant_request_id,
                "responseCode": "0",
                "responseDescription": "Success. Request accepted for processing",
                "customerMessage": "Success. Request accepted for processing"
            }
            
            self._set_response(200)
            self.wfile.write(json_dumps(response).encode())
            return
        
        # M-Pesa callback (for webhook)
        elif path == '/mpesa/callback':
            # Process M-Pesa callback data (simulate success for development)
            response = {"success": True}
            
            self._set_response(200)
            self.wfile.write(json_dumps(response).encode())
            return
        
        # Update message status (admin only)
        elif path == '/messages/status':
            auth_header = self.headers.get('Authorization', '')
            
            # Verify admin token and extract user info
            token = extract_auth_token(self)
            if not token:
                self._set_response(401)
                self.wfile.write(json_dumps({"error": "Authentication required"}).encode())
                return
            
            payload = verify_token(token)
            if isinstance(payload, dict) and "error" in payload:
                self._set_response(401)
                self.wfile.write(json_dumps({"error": payload["error"]}).encode())
                return
            
            # Check if user is admin
            if not payload.get("is_admin", False):
                self._set_response(403)
                self.wfile.write(json_dumps({"error": "Unauthorized access: Admin privileges required"}).encode())
                return
            
            # Check required fields
            if 'message_id' not in post_data or 'status' not in post_data:
                self._set_response(400)
                self.wfile.write(json_dumps({"error": "Message ID and status required"}).encode())
                return
            
            response = update_message_status(post_data['message_id'], post_data['status'])
            
            if "error" in response:
                self._set_response(400)
            else:
                self._set_response(200)
            
            self.wfile.write(json_dumps(response).encode())
            return
        
        # Default 404 response
        self._set_response(404)
        self.wfile.write(json_dumps({"error": "Resource not found"}).encode())
    
    def do_PUT(self):
        path = self.path
        
        # Parse form data (for multipart/form-data)
        if "multipart/form-data" in self.headers.get('Content-Type', ''):
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={
                    'REQUEST_METHOD': 'PUT',
                    'CONTENT_TYPE': self.headers['Content-Type'],
                }
            )
            
            # Update artwork with file upload (admin only)
            if path.startswith('/artworks/') and len(path.split('/')) == 3:
                artwork_id = path.split('/')[2]
                auth_header = self.headers.get('Authorization', '')
                
                # Check if admin is authenticated
                token = extract_auth_token(self)
                if not token:
                    self._set_response(401)
                    self.wfile.write(json_dumps({"error": "Authentication required"}).encode())
                    return
                
                payload = verify_token(token)
                if isinstance(payload, dict) and "error" in payload:
                    self._set_response(401)
                    self.wfile.write(json_dumps({"error": payload["error"]}).encode())
                    return
                
                # Check if user is admin
                if not payload.get("is_admin", False):
                    self._set_response(403)
                    self.wfile.write(json_dumps({"error": "Unauthorized access: Admin privileges required"}).encode())
                    return
                
                # Process form data
                post_data = {}
                for field in form.keys():
                    if field != 'image':
                        post_data[field] = form[field].value
                
                # Process image upload
                if 'image' in form:
                    fileitem = form['image']
                    if fileitem.filename:
                        # Generate unique filename
                        filename = f"{uuid.uuid4()}{os.path.splitext(fileitem.filename)[1]}"
                        filepath = os.path.join(UPLOAD_DIR, filename)
                        
                        # Save file
                        with open(filepath, 'wb') as f:
                            f.write(fileitem.file.read())
                        
                        # Update image_url in post_data
                        post_data['imageUrl'] = f"/uploads/{filename}"
                
                # Update artwork
                response = update_artwork(auth_header, artwork_id, post_data)
                
                if "error" in response:
                    error_message = response["error"]
                    
                    if "Authentication" in error_message or "authorized" in error_message:
                        self._set_response(401)
                    elif "Admin" in error_message:
                        self._set_response(403)
                    elif "not found" in error_message:
                        self._set_response(404)
                    else:
                        self._set_response(400)
                        
                    self.wfile.write(json_dumps({"error": error_message}).encode())
                    return
                
                self._set_response(200)
                self.wfile.write(json_dumps(response).encode())
                return
            
            # Update exhibition with file upload (admin only)
            elif path.startswith('/exhibitions/') and len(path.split('/')) == 3:
                exhibition_id = path.split('/')[2]
                auth_header = self.headers.get('Authorization', '')
                
                # Check if admin is authenticated
                token = extract_auth_token(self)
                if not token:
                    self._set_response(401)
                    self.wfile.write(json_dumps({"error": "Authentication required"}).encode())
                    return
                
                payload = verify_token(token)
                if isinstance(payload, dict) and "error" in payload:
                    self._set_response(401)
                    self.wfile.write(json_dumps({"error": payload["error"]}).encode())
                    return
                
                # Check if user is admin
                if not payload.get("is_admin", False):
                    self._set_response(403)
                    self.wfile.write(json_dumps({"error": "Unauthorized access: Admin privileges required"}).encode())
                    return
                
                # Process form data
                post_data = {}
                for field in form.keys():
                    if field != 'image':
                        post_data[field] = form[field].value
                
                # Process image upload
                if 'image' in form:
                    fileitem = form['image']
                    if fileitem.filename:
                        # Generate unique filename
                        filename = f"{uuid.uuid4()}{os.path.splitext(fileitem.filename)[1]}"
                        filepath = os.path.join(UPLOAD_DIR, filename)
                        
                        # Save file
                        with open(filepath, 'wb') as f:
                            f.write(fileitem.file.read())
                        
                        # Update imageUrl in post_data
                        post_data['imageUrl'] = f"/uploads/{filename}"
                
                # Update exhibition
                response = update_exhibition(auth_header, exhibition_id, post_data)
                
                if "error" in response:
                    error_message = response["error"]
                    
                    if "Authentication" in error_message or "authorized" in error_message:
                        self._set_response(401)
                    elif "Admin" in error_message:
                        self._set_response(403)
                    elif "not found" in error_message:
                        self._set_response(404)
                    else:
                        self._set_response(400)
                        
                    self.wfile.write(json_dumps({"error": error_message}).encode())
                    return
                
                self._set_response(200)
                self.wfile.write(json_dumps(response).encode())
                return
        
        # Get content length for regular JSON data
        content_length = int(self.headers.get('Content-Length', 0))
        
        # Parse JSON data
        post_data = {}
        if content_length > 0 and "application/json" in self.headers.get('Content-Type', ''):
            post_data = json.loads(self.rfile.read(content_length).decode('utf-8'))
        
        # Default 404 response
        self._set_response(404)
        self.wfile.write(json_dumps({"error": "Resource not found"}).encode())
    
    def do_DELETE(self):
        # Process based on path
        path = self.path
        
        # Delete artwork (admin only)
        if path.startswith('/artworks/') and len(path.split('/')) == 3:
            artwork_id = path.split('/')[2]
            auth_header = self.headers.get('Authorization', '')
            
            response = delete_artwork(auth_header, artwork_id)
            
            if "error" in response:
                error_message = response["error"]
                
                if "Authentication" in error_message or "authorized" in error_message:
                    self._set_response(401)
                elif "Admin" in error_message:
                    self._set_response(403)
                elif "not found" in error_message:
                    self._set_response(404)
                else:
                    self._set_response(400)
                    
                self.wfile.write(json_dumps({"error": error_message}).encode())
                return
            
            self._set_response(200)
            self.wfile.write(json_dumps(response).encode())
            return
        
        # Delete exhibition (admin only)
        elif path.startswith('/exhibitions/') and len(path.split('/')) == 3:
            exhibition_id = path.split('/')[2]
            auth_header = self.headers.get('Authorization', '')
            
            response = delete_exhibition(auth_header, exhibition_id)
            
            if "error" in response:
                error_message = response["error"]
                
                if "Authentication" in error_message or "authorized" in error_message:
                    self._set_response(401)
                elif "Admin" in error_message:
                    self._set_response(403)
                elif "not found" in error_message:
                    self._set_response(404)
                else:
                    self._set_response(400)
                    
                self.wfile.write(json_dumps({"error": error_message}).encode())
                return
            
            self._set_response(200)
            self.wfile.write(json_dumps(response).encode())
            return
        
        # Default 404 response
        self._set_response(404)
        self.wfile.write(json_dumps({"error": "Resource not found"}).encode())

def main():
    """Start the server"""
    # Initialize the database
    print("Initializing database...")
    initialize_database()
    
    # Create uploads directory
    print(f"Ensuring uploads directory exists at: {UPLOAD_DIR}")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Create an HTTP server
    print(f"Starting server on port {PORT}...")
    httpd = socketserver.ThreadingTCPServer(("", PORT), RequestHandler)
    print(f"Server running on port {PORT}")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
    finally:
        httpd.server_close()
        print("Server closed")

if __name__ == "__main__":
    main()
