# SHOP-SMART – Complete Easy Full-Stack Project

## Updated aesthetic edition
This edition includes a soft, clean pastel-style interface and an expanded product catalog with 18 products across Electronics, Fashion, Home, Beauty and Accessories.

## Project title
**SHOP-SMART – Full-Stack E-Commerce Web Application**

## What this project contains
This is a complete college-level full-stack version of the SHOP-SMART project.

### Frontend
- HTML
- CSS
- JavaScript
- Responsive user interface

### Backend
- Node.js
- Express.js
- REST APIs
- JWT authentication
- bcrypt password hashing

### Data storage
- A local JSON database (`data/db.json`)
- No MongoDB setup is required, making the project much easier to run and demonstrate.

## Main modules
1. User registration and login
2. Product listing
3. Product search
4. Category filtering
5. Shopping cart
6. Checkout
7. Order history
8. Admin dashboard
9. Admin product addition
10. Admin order-status management
11. Stock management
12. Persistent local data

## How to run

### Requirement
Install **Node.js LTS** from the official Node.js website.

### Step 1
Extract the ZIP.

### Step 2
Open a Command Prompt inside the `SHOP_SMART_FullStack` folder.

### Step 3
Run:
```bash
npm install
```

### Step 4
Run:
```bash
npm start
```

### Step 5
Open:
```text
http://localhost:5000
```

## Admin login
Email:
```text
admin@shopsmart.com
```

Password:
```text
admin123
```

## Normal user
Create a new account from the Register option.

## Important
The first time the server starts, it automatically creates:
`data/db.json`

Do not delete this file while the server is running if you want to keep your products, users and orders.

## API overview
- `GET /api/products`
- `POST /api/register`
- `POST /api/login`
- `POST /api/orders`
- `GET /api/my-orders`
- `GET /api/admin/stats`
- `GET /api/admin/orders`
- `POST /api/admin/products`
- `DELETE /api/admin/products/:id`
- `PUT /api/admin/orders/:id`

## Project flow
User → Register/Login → Browse Products → Search/Filter → Add to Cart → Checkout → Place Order → View Orders

Admin → Login → Dashboard → Add Products → View Orders → Update Order Status

## Why this version is easy
Only one command is used to start the application:
`npm start`

There is no separate frontend server and no MongoDB configuration.
