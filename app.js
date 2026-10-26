let token=localStorage.getItem("shopSmartToken");
let currentUser=JSON.parse(localStorage.getItem("shopSmartUser")||"null");
let cart=JSON.parse(localStorage.getItem("shopSmartCart")||"[]");
let registerMode=false;

const $=id=>document.getElementById(id);
function api(url,options={}){options.headers={...(options.headers||{}), "Content-Type":"application/json", ...(token?{Authorization:"Bearer "+token}:{})};return fetch(url,options).then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||"Request failed");return d});}
function saveCart(){localStorage.setItem("shopSmartCart",JSON.stringify(cart));$("cartCount").textContent=cart.reduce((s,i)=>s+i.quantity,0);}
function showPage(id){
 document.querySelectorAll(".page").forEach(x=>x.classList.add("hidden"));
 $(id).classList.remove("hidden");
 if(id==="products")loadProducts();
 if(id==="cart")renderCart();
 if(id==="orders")loadOrders();
 if(id==="admin")loadAdmin();
 window.scrollTo(0,0);
}
async function loadProducts(){
 const q=encodeURIComponent($("search").value||"");
 const c=encodeURIComponent($("category").value||"All");
 try{
  const products=await api(`/api/products?q=${q}&category=${c}`);
  $("itemPill").textContent=`${products.length} ${products.length===1?"item":"items"}`;
  $("productGrid").innerHTML=products.map(p=>`
  <div class="card"><div class="emoji">${p.icon}</div><h3>${p.name}</h3><p>${p.description}</p>
  <p>${p.category} • Stock: ${p.stock}</p><p class="price">₹${p.price}</p>
  <button onclick="addToCart(${p.id})" ${p.stock<1?"disabled":""}>${p.stock<1?"Out of Stock":"Add to Cart"}</button></div>`).join("")||"<div class='formCard'><h3>No products found</h3><p>Try another search or category.</p></div>";
 }catch(e){alert(e.message)}
}
async function addToCart(id){
 const products=await api("/api/products");
 const p=products.find(x=>x.id===id);
 const found=cart.find(x=>x.productId===id);
 if(found)found.quantity++;
 else cart.push({productId:id,name:p.name,price:p.price,icon:p.icon,quantity:1});
 saveCart(); alert(p.name+" added to cart!");
}
function renderCart(){
 if(!cart.length){$("cartBox").innerHTML="<p>Your cart is empty.</p>";return}
 const total=cart.reduce((s,i)=>s+i.price*i.quantity,0);
 $("cartBox").innerHTML=cart.map((i,index)=>`
 <div class="cartRow"><span>${i.icon} <b>${i.name}</b> — ₹${i.price} × ${i.quantity}</span>
 <span><button onclick="changeQty(${index},-1)">−</button> <b>${i.quantity}</b> <button onclick="changeQty(${index},1)">+</button> <button class="danger" onclick="removeCart(${index})">Remove</button></span></div>`).join("")+
 `<div class="formCard"><h3>Total: ₹${total}</h3><input id="address" placeholder="Delivery address"><button class="primary" onclick="placeOrder()">Place Order</button></div>`;
}
function changeQty(i,d){cart[i].quantity+=d;if(cart[i].quantity<=0)cart.splice(i,1);saveCart();renderCart()}
function removeCart(i){cart.splice(i,1);saveCart();renderCart()}
async function placeOrder(){
 if(!token){alert("Please login before placing an order.");showPage("login");return}
 const address=$("address").value.trim(); if(!address){alert("Enter delivery address");return}
 window.checkoutAddress=address; $("paymentModal").classList.remove("hidden"); togglePaymentFields();
}
function closePayment(){ $("paymentModal").classList.add("hidden"); }
function selectedPayment(){ return document.querySelector('input[name="paymentMethod"]:checked').value; }
function togglePaymentFields(){
 const method=selectedPayment();
 $("upiFields").classList.toggle("hidden",method!=="UPI");
 $("cardFields").classList.toggle("hidden",method!=="Card");
 $("codFields").classList.toggle("hidden",method!=="COD");
}
async function confirmPayment(){
 const method=selectedPayment();
 let payment={method,status:"Paid",transactionId:""};
 if(method==="UPI"){
   const upi=$("upiId").value.trim();
   if(!upi || !upi.includes("@")){alert("Enter a valid demo UPI ID, for example demo@upi");return}
   payment.transactionId="UPI-"+Date.now();
 }else if(method==="Card"){
   const number=$("cardNumber").value.replace(/\s/g,"");
   const expiry=$("cardExpiry").value.trim(); const cvv=$("cardCvv").value.trim();
   if(number.length<12 || !/^\d+$/.test(number) || !expiry || cvv.length<3){alert("Enter demo card details");return}
   payment.transactionId="CARD-"+Date.now();
 }else{ payment.status="Pending - COD"; payment.transactionId="COD-"+Date.now(); }
 try{
   const r=await api("/api/orders",{method:"POST",body:JSON.stringify({items:cart,address:window.checkoutAddress,payment})});
   closePayment(); alert(r.message+"\nPayment: "+payment.method+"\nTransaction: "+payment.transactionId); cart=[]; saveCart(); showPage("orders");
 }catch(e){alert(e.message)}
}
function toggleRegister(){
 registerMode=!registerMode;
 $("authTitle").textContent=registerMode?"Create Account":"Login";
 $("authButton").textContent=registerMode?"Register":"Login";
 $("switchAuth").textContent=registerMode?"Already have an account? Login":"Create an account";
 $("registerNameWrap").classList.toggle("hidden",!registerMode);
 $("authMessage").textContent="";
}
async function submitAuth(){
 try{
  if(registerMode){
   const r=await api("/api/register",{method:"POST",body:JSON.stringify({name:$("regName").value,email:$("email").value,password:$("password").value})});
   $("authMessage").textContent=r.message;toggleRegister();
  }else{
   const r=await api("/api/login",{method:"POST",body:JSON.stringify({email:$("email").value,password:$("password").value})});
   token=r.token;currentUser=r.user;localStorage.setItem("shopSmartToken",token);localStorage.setItem("shopSmartUser",JSON.stringify(currentUser));updateNav();alert("Login successful");showPage("home");
  }
 }catch(e){$("authMessage").textContent=e.message}
}
function logout(){token=null;currentUser=null;localStorage.removeItem("shopSmartToken");localStorage.removeItem("shopSmartUser");updateNav();showPage("home")}
function updateNav(){
 $("loginNav").classList.toggle("hidden",!!token);$("logoutNav").classList.toggle("hidden",!token);
 $("adminNav").classList.toggle("hidden",!(currentUser&&currentUser.role==="admin"));
 saveCart();
}
async function loadOrders(){
 if(!token){$("ordersBox").innerHTML="<p>Please login to view orders.</p>";return}
 try{const orders=await api("/api/my-orders");$("ordersBox").innerHTML=orders.length?orders.map(o=>`
 <div class="order"><b>${o.id}</b> — ${new Date(o.createdAt).toLocaleString()}<br>
 Status: <b>${o.status}</b><ul>${o.items.map(i=>`<li>${i.name} × ${i.quantity} — ₹${i.price*i.quantity}</li>`).join("")}</ul>
 <b>Total: ₹${o.total}</b><br>Payment: ${o.payment?.method||"N/A"} — ${o.payment?.status||"N/A"}<br>Transaction: ${o.payment?.transactionId||"N/A"}<br>Address: ${o.address}</div>`).join(""):"<p>No orders yet.</p>"}catch(e){$("ordersBox").innerHTML=e.message}
}
async function loadAdmin(){
 if(!currentUser||currentUser.role!=="admin"){showPage("home");return}
 try{
  const s=await api("/api/admin/stats");$("stats").innerHTML=`
  <div class="stat"><b>${s.users}</b>Users</div><div class="stat"><b>${s.products}</b>Products</div>
  <div class="stat"><b>${s.orders}</b>Orders</div><div class="stat"><b>₹${s.revenue}</b>Revenue</div>`;
  const orders=await api("/api/admin/orders");
  $("adminOrders").innerHTML=orders.length?orders.map(o=>`<div class="order"><b>${o.id}</b><br>${o.customer} — ₹${o.total}
  <br><select class="smallSelect" onchange="updateOrder('${o.id}',this.value)">
  ${["Placed","Packed","Shipped","Delivered","Cancelled"].map(x=>`<option ${x===o.status?"selected":""}>${x}</option>`).join("")}</select></div>`).join(""):"<p>No orders.</p>";
 }catch(e){alert(e.message)}
}
async function addProduct(){
 try{
  const data={name:$("pname").value,category:$("pcat").value,price:$("pprice").value,stock:$("pstock").value,icon:$("picon").value,description:$("pdesc").value};
  await api("/api/admin/products",{method:"POST",body:JSON.stringify(data)});
  $("adminMessage").textContent="Product added successfully.";loadAdmin();
 }catch(e){$("adminMessage").textContent=e.message}
}
async function updateOrder(id,status){try{await api("/api/admin/orders/"+id,{method:"PUT",body:JSON.stringify({status})});loadAdmin()}catch(e){alert(e.message)}}
updateNav();showPage("home");