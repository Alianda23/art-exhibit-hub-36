
from database import get_db_connection, dict_from_row, json_dumps
from auth import verify_token
import json
from decimal import Decimal

def get_all_artworks():
    """Get all artworks from the database"""
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        query = """
        SELECT id, title, artist, description, price, image_url, 
               dimensions, medium, year, status
        FROM artworks
        ORDER BY created_at DESC
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        
        artworks = []
        for row in rows:
            artwork = dict_from_row(row, cursor)
            
            # Convert id to string to match frontend expectations
            artwork['id'] = str(artwork['id'])
            artworks.append(artwork)
        
        return {"artworks": artworks}
    except Exception as e:
        print(f"Error getting artworks: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def get_artwork(artwork_id):
    """Get a specific artwork by ID"""
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        query = """
        SELECT id, title, artist, description, price, image_url, 
               dimensions, medium, year, status
        FROM artworks
        WHERE id = %s
        """
        cursor.execute(query, (artwork_id,))
        row = cursor.fetchone()
        
        if not row:
            return {"error": "Artwork not found"}
        
        artwork = dict_from_row(row, cursor)
        # Convert id to string to match frontend expectations
        artwork['id'] = str(artwork['id'])
        
        return artwork
    except Exception as e:
        print(f"Error getting artwork: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def create_artwork(auth_header, artwork_data):
    """Create a new artwork (admin only)"""
    print(f"\n--- Create Artwork Request ---")
    print(f"Auth Header: {auth_header}")
    print(f"Artwork Data: {artwork_data}")
    
    if not auth_header:
        print("ERROR: Authentication header missing")
        return {"error": "Authentication required"}
    
    # Extract token from header - handle both formats
    token = None
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]
    else:
        parts = auth_header.split(" ")
        if len(parts) > 1:
            token = parts[1]
    
    if not token:
        print("ERROR: No token found in header")
        return {"error": "Invalid authentication token"}
    
    # Verify token and check if user is admin
    print(f"Verifying token: {token[:20]}...")
    payload = verify_token(token)
    print(f"Token verification result: {payload}")
    
    # Check if verification returned an error
    if isinstance(payload, dict) and "error" in payload:
        print(f"ERROR: Token verification failed: {payload['error']}")
        return {"error": f"Authentication failed: {payload['error']}"}
    
    # Check if user is admin
    is_admin = payload.get("is_admin", False)
    print(f"Is admin: {is_admin}")
    
    if not is_admin:
        print("ERROR: Access denied - Not an admin user")
        return {"error": "Unauthorized access: Admin privileges required"}
    
    # Continue with artwork creation
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        # Parse artwork_data if it's a string
        if isinstance(artwork_data, str):
            try:
                artwork_data = json.loads(artwork_data)
            except json.JSONDecodeError as e:
                print(f"ERROR: Failed to parse artwork data: {e}")
                return {"error": f"Invalid artwork data format: {str(e)}"}
        
        print(f"Inserting artwork data: {artwork_data}")
        query = """
        INSERT INTO artworks (title, artist, description, price, image_url,
                           dimensions, medium, year, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            artwork_data.get("title"),
            artwork_data.get("artist"),
            artwork_data.get("description"),
            artwork_data.get("price"),
            artwork_data.get("imageUrl"),
            artwork_data.get("dimensions"),
            artwork_data.get("medium"),
            artwork_data.get("year"),
            artwork_data.get("status", "available")
        ))
        connection.commit()
        
        # Return the newly created artwork
        new_artwork_id = cursor.lastrowid
        print(f"Artwork created successfully with ID: {new_artwork_id}")
        return get_artwork(new_artwork_id)
    except Exception as e:
        print(f"ERROR creating artwork: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def update_artwork(auth_header, artwork_id, artwork_data):
    """Update an existing artwork (admin only)"""
    if not auth_header:
        return {"error": "Authentication required"}
    
    # Extract token from header
    token = auth_header.split(" ")[1] if len(auth_header.split(" ")) > 1 else None
    if not token:
        return {"error": "Invalid authentication token"}
    
    # Debug token verification
    print(f"Verifying token for update_artwork: {token}")
    
    # Verify token and check if user is admin
    payload = verify_token(token)
    print(f"Token verification result: {payload}")
    
    # Check if verification returned an error
    if isinstance(payload, dict) and "error" in payload:
        return {"error": f"Token verification failed: {payload['error']}"}
    
    # Check if user is admin
    is_admin = payload.get("is_admin")
    if not is_admin:
        print("Access denied: Not an admin user")
        return {"error": "Unauthorized access: Not an admin"}
    
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        query = """
        UPDATE artworks
        SET title = %s, artist = %s, description = %s, price = %s,
            image_url = %s, dimensions = %s, medium = %s, year = %s, status = %s
        WHERE id = %s
        """
        
        # Only update image_url if it's in the data
        image_url = artwork_data.get("imageUrl", artwork_data.get("image_url"))
        
        # If no image_url in data, get the current one
        if not image_url:
            cursor.execute("SELECT image_url FROM artworks WHERE id = %s", (artwork_id,))
            current_img = cursor.fetchone()
            if current_img:
                image_url = current_img[0]
        
        cursor.execute(query, (
            artwork_data.get("title"),
            artwork_data.get("artist"),
            artwork_data.get("description"),
            artwork_data.get("price"),
            image_url,
            artwork_data.get("dimensions"),
            artwork_data.get("medium"),
            artwork_data.get("year"),
            artwork_data.get("status"),
            artwork_id
        ))
        connection.commit()
        
        # Check if artwork was found and updated
        if cursor.rowcount == 0:
            return {"error": "Artwork not found"}
        
        # Return the updated artwork
        return get_artwork(artwork_id)
    except Exception as e:
        print(f"Error updating artwork: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def delete_artwork(auth_header, artwork_id):
    """Delete an artwork (admin only)"""
    if not auth_header:
        return {"error": "Authentication required"}
    
    # Extract token from header
    token = auth_header.split(" ")[1] if len(auth_header.split(" ")) > 1 else None
    if not token:
        return {"error": "Invalid authentication token"}
    
    # Debug token verification
    print(f"Verifying token for delete_artwork: {token}")
    
    # Verify token and check if user is admin
    payload = verify_token(token)
    print(f"Token verification result: {payload}")
    
    # Check if verification returned an error
    if isinstance(payload, dict) and "error" in payload:
        return {"error": f"Token verification failed: {payload['error']}"}
    
    # Check if user is admin
    is_admin = payload.get("is_admin")
    if not is_admin:
        print("Access denied: Not an admin user")
        return {"error": "Unauthorized access: Not an admin"}
    
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        query = "DELETE FROM artworks WHERE id = %s"
        cursor.execute(query, (artwork_id,))
        connection.commit()
        
        # Check if artwork was found and deleted
        if cursor.rowcount == 0:
            return {"error": "Artwork not found"}
        
        return {"success": True, "message": "Artwork deleted successfully"}
    except Exception as e:
        print(f"Error deleting artwork: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
