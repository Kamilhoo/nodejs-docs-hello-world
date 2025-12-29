# RUG APIs Documentation

Complete documentation for Rug Management APIs - Frontend ke liye ready hai!

## 📌 Table of Contents
1. [Overview](#overview)
2. [Image Upload](#image-upload)
3. [Create Rug](#create-rug)
4. [Get All Rugs](#get-all-rugs)
5. [Get Rug by ID](#get-rug-by-id)
6. [Update Rug](#update-rug)
7. [Delete Rug](#delete-rug)
8. [Get All Rugs (Admin)](#get-all-rugs-admin)

---

## Overview

**Base URL**: `http://localhost:5000` (production me apna domain daalna)

**Auth Required**: Jab tak mentioned na ho, wahi APIs public hain.

**Admin Auth**: `Authorization: Bearer <jwt-token>` (Admin login se milega)

---

## Image Upload

### `POST /upload/image` (Admin Only)

Pehle image upload karo, phir us URL ko rug create/update mein use karo.

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "image": {
    "data": "data:image/jpeg;base64,/9j/4AAQSkZJRg...", // ya sirf base64 string
    "mimeType": "image/jpeg" // optional
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "imageUrl": "/uploads/rugs/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg"
}
```

**Error Response (400/401/403/500):**
```json
{
  "success": false,
  "message": "Image data is required"
}
```

**Important Points:**
- ✅ Ek baar me **1 image** upload hoti hai
- ✅ Max file size: **10MB**
- ✅ Supported formats: JPEG, PNG, GIF, WebP, SVG
- ✅ Response mein milega **imageUrl** - yehi use karna hai rug APIs mein
- ✅ Image URL format: `/uploads/rugs/<uuid>.<extension>`

**Example Usage:**
```javascript
// 5 images upload karni hain? 5 baar API call karo
const imageUrls = [];

for (let i = 0; i < 5; i++) {
  const response = await fetch('http://localhost:5000/upload/image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image: {
        data: base64Images[i],
        mimeType: 'image/jpeg'
      }
    })
  });
  
  const result = await response.json();
  imageUrls.push(result.imageUrl);
}

// Ab imageUrls array use karo rug create mein
```

---

## Create Rug

### `POST /rugs` (Admin Only)

Naya rug create karo.

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Persian Handwoven Rug",
  "brand": "Luxury Carpets",
  "description": "Beautiful handwoven Persian rug with intricate designs",
  "images": [
    "/uploads/rugs/uuid1.jpg",
    "/uploads/rugs/uuid2.jpg"
  ],
  "category": "Traditional",
  "originalPrice": 50000,
  "discountPercent": 30,
  "colors": ["#FF0000", "#0000FF"],
  "sizes": ["5x8", "8x10"],
  "isOnSale": true,
  "isActive": true
}
```

**Required Fields:**
- `title` - String (1-200 chars)
- `brand` - String (1-100 chars)
- `category` - String (1-100 chars)
- `images` - Array of image URLs (1-5 URLs, must be from /upload/image)
- `originalPrice` - Number (minimum 0)
- `discountPercent` - Number (0-100)

**Optional Fields:**
- `description` - String (max 2000 chars, default: "")
- `colors` - Array of hex codes (default: [])
- `sizes` - Array of size strings (default: [])
- `isOnSale` - Boolean (default: false)
- `isActive` - Boolean (default: true)

**Auto-Calculated:**
- `salePrice` - Automatically calculated: `originalPrice * (1 - discountPercent/100)`
- `isOnSale` - Auto-set to `true` if discountPercent > 0
- `createdBy` - Admin ID automatically added

**Success Response (201):**
```json
{
  "success": true,
  "message": "Rug created successfully",
  "rug": {
    "_id": "67890abcdef",
    "title": "Persian Handwoven Rug",
    "brand": "Luxury Carpets",
    "description": "Beautiful handwoven Persian rug with intricate designs",
    "images": [
      "/uploads/rugs/uuid1.jpg",
      "/uploads/rugs/uuid2.jpg"
    ],
    "category": "Traditional",
    "originalPrice": 50000,
    "salePrice": 35000,
    "discountPercent": 30,
    "colors": ["#FF0000", "#0000FF"],
    "sizes": ["5x8", "8x10"],
    "isOnSale": true,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
```json
// Invalid URL
{
  "success": false,
  "message": "Invalid image URL format. Images must be uploaded via /upload/image endpoint first."
}

// Too many images
{
  "success": false,
  "message": "Please provide 1-5 image URLs"
}

// Invalid price
{
  "success": false,
  "message": "Valid original price is required"
}
```

---

## Get All Rugs

### `GET /rugs` (Public)

Sabhi active rugs fetch karo with filters.

**Query Parameters:**
```
?category=Traditional
&brand=Luxury Carpets
&isOnSale=true
&minPrice=10000
&maxPrice=50000
&colors=#FF0000
&colors=#0000FF
&sizes=5x8
&sizes=8x10
&page=1
&limit=20
&sortBy=price
&sortOrder=desc
```

**Filter Options:**
- `category` - String (exact match)
- `brand` - String (exact match)
- `isOnSale` - Boolean
- `minPrice` - Number
- `maxPrice` - Number
- `colors` - String or Array (rug mein se koi bhi color match ho to show hoga)
- `sizes` - String or Array (rug mein se koi bhi size match ho to show hoga)
- `page` - Number (default: 1)
- `limit` - Number (default: 20, max: 100)
- `sortBy` - 'createdAt' | 'price' | 'title' (default: 'createdAt')
- `sortOrder` - 'asc' | 'desc' (default: 'desc')

**Success Response (200):**
```json
{
  "success": true,
  "rugs": [
    {
      "_id": "67890abcdef",
      "title": "Persian Handwoven Rug",
      "brand": "Luxury Carpets",
      "images": ["/uploads/rugs/uuid1.jpg"],
      "category": "Traditional",
      "originalPrice": 50000,
      "salePrice": 35000,
      "discountPercent": 30,
      "colors": ["#FF0000"],
      "sizes": ["5x8"],
      "isOnSale": true,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

**Examples:**
```
# Sirf Traditional category ke rugs
GET /rugs?category=Traditional

# Sale pe wale rugs
GET /rugs?isOnSale=true

# Price range mein
GET /rugs?minPrice=10000&maxPrice=50000

# Kisi specific color ke rugs
GET /rugs?colors=#FF0000

# Multiple colors
GET /rugs?colors=#FF0000&colors=#0000FF

# Kisi size ke rugs
GET /rugs?sizes=5x8

# Multiple filters combined
GET /rugs?category=Traditional&minPrice=20000&maxPrice=80000&colors=#FF0000&page=1&sortBy=price&sortOrder=asc
```

---

## Get Rug by ID

### `GET /rugs/:id` (Public)

Single rug ka full detail.

**Success Response (200):**
```json
{
  "success": true,
  "rug": {
    "_id": "67890abcdef",
    "title": "Persian Handwoven Rug",
    "brand": "Luxury Carpets",
    "description": "Beautiful handwoven Persian rug...",
    "images": ["/uploads/rugs/uuid1.jpg"],
    "category": "Traditional",
    "originalPrice": 50000,
    "salePrice": 35000,
    "discountPercent": 30,
    "colors": ["#FF0000", "#0000FF"],
    "sizes": ["5x8", "8x10", "9x12"],
    "isOnSale": true,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Rug not found"
}
```

---

## Update Rug

### `PUT /rugs/:id` (Admin Only)

Existing rug ko update karo. Sirf jo fields update karni hain wo bhejo.

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

**Request Body (Partial Update):**
```json
{
  "title": "Updated Title",
  "originalPrice": 60000,
  "discountPercent": 40,
  "images": [
    "/uploads/rugs/new-uuid1.jpg",
    "/uploads/rugs/new-uuid2.jpg"
  ]
}
```

**Important Notes:**
- ✅ Sirf jo fields update karni hain wo bhejo
- ✅ **Agar `images` update karo** to purani saari images delete ho jayengi aur nayi replace ho jayengi
- ✅ **Agar `originalPrice` ya `discountPercent` update karo**, to `salePrice` automatically recalculate hoga
- ✅ Agar `discountPercent > 0`, to `isOnSale` automatically `true` ho jata hai

**Success Response (200):**
```json
{
  "success": true,
  "message": "Rug updated successfully",
  "rug": {
    "_id": "67890abcdef",
    "title": "Updated Title",
    "originalPrice": 60000,
    "salePrice": 36000,
    "discountPercent": 40,
    ...
  }
}
```

---

## Delete Rug

### `DELETE /rugs/:id` (Admin Only)

Rug aur uski saari images delete karo.

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Rug deleted successfully"
}
```

**Important:**
- ✅ Rug delete hote hi uski saari images bhi disk se delete ho jayengi
- ✅ No orphaned files

---

## Get All Rugs (Admin)

### `GET /admin/rugs` (Admin Only)

Admin ke liye saare rugs (active + inactive) with extra filters.

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Query Parameters:**
```
?category=Traditional
&brand=Luxury Carpets
&isOnSale=true
&isActive=false
&colors=#FF0000
&sizes=5x8
&page=1
&limit=20
&sortBy=price
&sortOrder=desc
```

**Extra Filter for Admin:**
- `isActive` - Boolean (inactive rugs bhi dikhayega)

**Success Response (200):**
```json
{
  "success": true,
  "rugs": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## Complete Flow Example

### Frontend Mein Kaise Use Karein

```javascript
// Step 1: Admin login kar ke token lo
const loginResponse = await fetch('http://localhost:5000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@dastkarrugs.com',
    password: 'admin123'
  })
});

const { token } = await loginResponse.json();

// Step 2: Images upload karo (ek-ek kar ke)
const uploadImage = async (base64Image) => {
  const response = await fetch('http://localhost:5000/upload/image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image: {
        data: base64Image,
        mimeType: 'image/jpeg'
      }
    })
  });
  return await response.json();
};

const image1 = await uploadImage(base64Img1);
const image2 = await uploadImage(base64Img2);
const image3 = await uploadImage(base64Img3);

// Step 3: Rug create karo with image URLs
const createRug = async () => {
  const response = await fetch('http://localhost:5000/rugs', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: "Beautiful Persian Rug",
      brand: "Luxury Carpets",
      description: "Handwoven with love",
      images: [
        image1.imageUrl,
        image2.imageUrl,
        image3.imageUrl
      ],
      category: "Traditional",
      originalPrice: 50000,
      discountPercent: 30,
      colors: ["#FF0000", "#0000FF"],
      sizes: ["5x8", "8x10"]
    })
  });
  return await response.json();
};

const newRug = await createRug();
console.log('Rug created:', newRug.rug);

// Step 4: Public ko dikhao
const getAllRugs = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`http://localhost:5000/rugs?${params}`);
  return await response.json();
};

// Filters ke sath
const rugs = await getAllRugs({
  category: 'Traditional',
  minPrice: '10000',
  maxPrice: '50000',
  colors: '#FF0000',
  sizes: '5x8'
});
```

---

## Error Codes

| Status | Meaning |
|--------|---------|
| 200/201 | Success |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (not admin) |
| 404 | Not Found (rug doesn't exist) |
| 500 | Server Error |

---

## Image URL Format

Image URLs always follow this format:
```
/uploads/rugs/<uuid>.<extension>
```

**Example:**
```
/uploads/rugs/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
```

Agar directly access karna hai:
```
http://localhost:5000/uploads/rugs/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
```

---

## Important Reminders

### Frontend Flow
1. ✅ **Pehle images upload karo** (ek-ek kar ke `/upload/image`)
2. ✅ **URLs collect karo** response se
3. ✅ **Phir rug create karo** with URLs array
4. ✅ **Update karne pe** agar images replace karoge, to purani auto-delete

### Security
- ✅ Admin routes pe **must** JWT token bhejna
- ✅ Token format: `Bearer <token>`
- ✅ Public routes (`GET /rugs`, `GET /rugs/:id`) pe token nahi chahiye

### Validation
- ✅ Images: **1-5 URLs** honi chahiye
- ✅ URL format: **must start with** `/uploads/rugs/`
- ✅ Price: **must be** >= 0
- ✅ Discount: **0-100** ke beech
- ✅ Colors/Sizes: **array format** mein

### MongoDB Filtering
- ✅ Colors aur Sizes filter: **OR logic** - agar rug mein se koi bhi match kare to show hoga
- ✅ Multiple colors: `?colors=#FF0000&colors=#0000FF` - dono mein se koi bhi
- ✅ Multiple sizes: `?sizes=5x8&sizes=8x10` - dono mein se koi bhi

---

## Testing

### Quick Test
```bash
# 1. Admin login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dastkarrugs.com","password":"admin123"}'

# Save the token

# 2. Upload image
curl -X POST http://localhost:5000/upload/image \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"image":{"data":"base64data"}}'

# Save the imageUrl

# 3. Create rug
curl -X POST http://localhost:5000/rugs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Test Rug",
    "brand":"Test",
    "category":"Test",
    "images":["/uploads/rugs/xxx.jpg"],
    "originalPrice":10000,
    "discountPercent":10
  }'

# 4. Get all rugs
curl http://localhost:5000/rugs

# 5. Get rug by ID
curl http://localhost:5000/rugs/<rug-id>
```

---

**Made with ❤️ for Dastkar Rugs**

