const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 5000;
const SECRET = "SHOP_SMART_COLLEGE_PROJECT_SECRET";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const dataDir = path.join(__dirname, "data");
const dbFile = path.join(dataDir, "db.json");

// Create the data folder automatically on first run.
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function initialDB() {
  return {
    users: [
      {
        id: 1,
        name: "Admin",
        email: "admin@shopsmart.com",
        password: bcrypt.hashSync("admin123", 10),
        role: "admin"
      }
    ],
    products: [
      {id:1,name:"Wireless Headphones",category:"Electronics",price:1499,stock:20,icon:"🎧",description:"Comfortable wireless headphones with clear sound."},
      {id:2,name:"Smart Watch",category:"Electronics",price:1999,stock:15,icon:"⌚",description:"Smart watch for everyday activity tracking."},
      {id:3,name:"Bluetooth Speaker",category:"Electronics",price:1299,stock:18,icon:"🔊",description:"Portable speaker with warm, room-filling sound."},
      {id:4,name:"Desk Lamp",category:"Electronics",price:899,stock:16,icon:"💡",description:"Soft LED desk lighting for study and work."},
      {id:5,name:"Mini Power Bank",category:"Electronics",price:1099,stock:22,icon:"🔋",description:"Compact power bank for everyday charging."},
      {id:6,name:"Casual T-Shirt",category:"Fashion",price:699,stock:30,icon:"👕",description:"Soft cotton casual T-shirt for daily wear."},
      {id:7,name:"Handbag",category:"Fashion",price:999,stock:12,icon:"👜",description:"Clean, versatile handbag for everyday use."},
      {id:8,name:"Sneakers",category:"Fashion",price:1599,stock:10,icon:"👟",description:"Comfortable sneakers for daily walks and outings."},
      {id:9,name:"Relaxed Hoodie",category:"Fashion",price:1299,stock:18,icon:"🧥",description:"Cozy hoodie with a relaxed everyday fit."},
      {id:10,name:"Classic Sunglasses",category:"Accessories",price:799,stock:24,icon:"🕶️",description:"Minimal sunglasses with an easy everyday style."},
      {id:11,name:"Coffee Mug",category:"Home",price:299,stock:25,icon:"☕",description:"Reusable ceramic mug for your favorite drink."},
      {id:12,name:"Cushion Set",category:"Home",price:599,stock:17,icon:"🛋️",description:"Soft decorative cushions for a cozy corner."},
      {id:13,name:"Plant Pot",category:"Home",price:449,stock:20,icon:"🪴",description:"Simple planter for a little touch of green."},
      {id:14,name:"Water Bottle",category:"Home",price:499,stock:28,icon:"🥤",description:"Reusable bottle for work, college and travel."},
      {id:15,name:"Face Care Set",category:"Beauty",price:899,stock:14,icon:"🧴",description:"A simple everyday self-care essentials set."},
      {id:16,name:"Scented Candle",category:"Beauty",price:549,stock:19,icon:"🕯️",description:"A soft fragrance for a calm evening at home."},
      {id:17,name:"Canvas Tote",category:"Accessories",price:399,stock:21,icon:"👜",description:"Reusable tote bag for books, groceries and more."},
      {id:18,name:"Minimal Wallet",category:"Accessories",price:649,stock:13,icon:"👛",description:"Slim wallet with practical everyday storage."}
    ],
    orders: []
  };
}

if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify(initialDB(), null, 2));
}
function readDB(){ return JSON.parse(fs.readFileSync(dbFile, "utf8")); }
function writeDB(db){ fs.writeFileSync(dbFile, JSON.stringify(db, null, 2)); }

function auth(req,res,next){
  const token = (req.headers.authorization || "").replace("Bearer ","");
  if(!token) return res.status(401).json({message:"Login required"});
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({message:"Invalid or expired token"});
  }
}
function admin(req,res,next){
  if(req.user.role !== "admin") return res.status(403).json({message:"Admin access required"});
  next();
}

// Products
app.get("/api/products",(req,res)=>{
  const db=readDB();
  const q=(req.query.q||"").toLowerCase();
  const category=req.query.category||"All";
  let products=db.products.filter(p =>
    (category==="All" || p.category===category) &&
    (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
  );
  res.json(products);
});

// Auth
app.post("/api/register",(req,res)=>{
  const {name,email,password}=req.body;
  if(!name || !email || !password) return res.status(400).json({message:"All fields are required"});
  const db=readDB();
  if(db.users.some(u=>u.email.toLowerCase()===email.toLowerCase()))
    return res.status(400).json({message:"Email already registered"});
  const user={id:Date.now(),name,email,password:bcrypt.hashSync(password,10),role:"user"};
  db.users.push(user); writeDB(db);
  res.json({message:"Registration successful. Please login."});
});

app.post("/api/login",(req,res)=>{
  const {email,password}=req.body;
  const db=readDB();
  const user=db.users.find(u=>u.email.toLowerCase()===String(email||"").toLowerCase());
  if(!user || !bcrypt.compareSync(password||"",user.password))
    return res.status(401).json({message:"Invalid email or password"});
  const token=jwt.sign({id:user.id,name:user.name,email:user.email,role:user.role},SECRET,{expiresIn:"2h"});
  res.json({token,user:{id:user.id,name:user.name,email:user.email,role:user.role}});
});

// Orders
app.post("/api/orders",auth,(req,res)=>{
  const {items,address,payment}=req.body;
  if(!Array.isArray(items) || items.length===0) return res.status(400).json({message:"Cart is empty"});
  if(!address) return res.status(400).json({message:"Delivery address is required"});
  const db=readDB();
  const orderItems=[];
  let total=0;

  for(const item of items){
    const product=db.products.find(p=>p.id===Number(item.productId));
    const qty=Number(item.quantity)||1;
    if(!product) return res.status(400).json({message:"Product not found"});
    if(qty<1 || qty>product.stock) return res.status(400).json({message:`Insufficient stock for ${product.name}`});
    orderItems.push({productId:product.id,name:product.name,price:product.price,quantity:qty});
    total += product.price*qty;
  }

  for(const item of orderItems){
    const p=db.products.find(x=>x.id===item.productId);
    p.stock -= item.quantity;
  }

  const order={
    id:"ORD"+Date.now(),
    userId:req.user.id,
    customer:req.user.name,
    items:orderItems,
    total,
    address,
    status:"Placed",
    payment: payment || {method:"COD",status:"Pending - COD",transactionId:"COD-"+Date.now()},
    createdAt:new Date().toISOString()
  };
  db.orders.unshift(order);
  writeDB(db);
  res.json({message:"Order placed successfully",order});
});

app.get("/api/my-orders",auth,(req,res)=>{
  const db=readDB();
  res.json(db.orders.filter(o=>o.userId===req.user.id));
});

// Admin
app.get("/api/admin/stats",auth,admin,(req,res)=>{
  const db=readDB();
  const revenue=db.orders.reduce((s,o)=>s+o.total,0);
  res.json({users:db.users.filter(u=>u.role==="user").length,products:db.products.length,orders:db.orders.length,revenue});
});

app.get("/api/admin/orders",auth,admin,(req,res)=>{
  res.json(readDB().orders);
});

app.post("/api/admin/products",auth,admin,(req,res)=>{
  const {name,category,price,stock,icon,description}=req.body;
  if(!name||!category||!price) return res.status(400).json({message:"Name, category and price are required"});
  const db=readDB();
  const product={id:Date.now(),name,category,price:Number(price),stock:Number(stock)||0,icon:icon||"🛍️",description:description||""};
  db.products.push(product); writeDB(db);
  res.json(product);
});

app.delete("/api/admin/products/:id",auth,admin,(req,res)=>{
  const db=readDB();
  const id=Number(req.params.id);
  const old=db.products.length;
  db.products=db.products.filter(p=>p.id!==id);
  if(db.products.length===old) return res.status(404).json({message:"Product not found"});
  writeDB(db);
  res.json({message:"Product deleted"});
});

app.put("/api/admin/orders/:id",auth,admin,(req,res)=>{
  const db=readDB();
  const order=db.orders.find(o=>o.id===req.params.id);
  if(!order) return res.status(404).json({message:"Order not found"});
  order.status=req.body.status || order.status;
  writeDB(db);
  res.json(order);
});

app.get("*",(req,res)=>{
  res.sendFile(path.join(__dirname,"public","index.html"));
});

app.listen(PORT,()=>console.log(`SHOP-SMART running at http://localhost:${PORT}`));
