document.addEventListener('DOMContentLoaded', () => {
    
    // --- UTILITY & AUTHENTICATION SIMULATION ---
    function getCart() { return JSON.parse(localStorage.getItem('shoppingCart')) || []; }
    function saveCart(cart) { localStorage.setItem('shoppingCart', JSON.stringify(cart)); updateCartCounter(); }
    function getLoggedInUser() { return JSON.parse(localStorage.getItem('loggedInUser')); }
    function saveLoggedInUser(user) { localStorage.setItem('loggedInUser', JSON.stringify(user)); }
    function logoutUser() { localStorage.removeItem('loggedInUser'); }
    
    // --- UI UPDATE FUNCTIONS ---
    function updateHeaderUI() {
        const authLinks = document.getElementById('auth-links');
        const user = getLoggedInUser();
        if (!authLinks) return;

        if (user) {
            authLinks.innerHTML = `<span>Welcome, ${user.name.split(' ')[0]}</span><a href="#" id="logout-btn" class="auth-btn">Logout</a>`;
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    logoutUser();
                    showToast('You have been logged out.');
                    setTimeout(() => { window.location.reload(); }, 1500);
                });
            }
        } else {
            authLinks.innerHTML = `<a href="login.html" class="auth-btn">Login</a><a href="signup.html" class="auth-btn primary">Sign Up</a>`;
        }
    }

    function updateCartCounter() {
        const cart = getCart();
        const counters = document.querySelectorAll('#cart-counter'); // Select all counters
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        counters.forEach(counter => {
            if (counter) { counter.textContent = totalItems; }
        });
    }
    
    const toast = document.getElementById('toast-notification');
    let toastTimeout;
    function showToast(message, isError = false) {
        if (!toast) return;
        clearTimeout(toastTimeout);
        toast.textContent = message;
        toast.className = 'show';
        if (isError) { toast.classList.add('error'); }
        toastTimeout = setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3000);
    }

    // --- PAGE-SPECIFIC LOGIC ---

    // HOMEPAGE LOGIC
    if (document.querySelector('#products')) {
        const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', () => {
                const name = button.dataset.name;
                const price = parseFloat(button.dataset.price);
                let cart = getCart();
                const existingItem = cart.find(item => item.name === name);
                if (existingItem) {
                    existingItem.quantity++;
                } else {
                    cart.push({ name, price, quantity: 1 });
                }
                saveCart(cart);
                showToast(`${name} was added to your cart.`);
            });
        });
    }

    // CART PAGE LOGIC
    if (document.querySelector('#cart-page')) {
        const cartContainer = document.getElementById('cart-container');
        const cartSummary = document.getElementById('cart-summary');
        const checkoutLink = document.getElementById('checkout-link');

        function renderCartPage() {
            const cart = getCart();
            const totalPriceElement = document.getElementById('total-price');

            if (cart.length === 0) {
                cartContainer.innerHTML = '<p>Your cart is currently empty.</p>';
                if (cartSummary) cartSummary.style.display = 'none';
            } else {
                if (cartSummary) cartSummary.style.display = 'block';
                let totalPrice = 0;
                
                // Start with the header
                cartContainer.innerHTML = `<div class="cart-header">
                    <span>Product</span><span>Price</span><span>Quantity</span><span>Actions</span>
                </div>`;

                // Add each item
                cart.forEach(item => {
                    totalPrice += item.price * item.quantity;
                    const itemElement = document.createElement('div');
                    itemElement.classList.add('cart-item');
                    itemElement.innerHTML = `
                        <div class="cart-item-info"><p><strong>${item.name}</strong></p></div>
                        <p>₹${item.price.toLocaleString()}</p>
                        <div class="quantity-controls">
                            <button class="quantity-btn" data-name="${item.name}" data-action="decrease">-</button>
                            <span class="quantity-display">${item.quantity}</span>
                            <button class="quantity-btn" data-name="${item.name}" data-action="increase">+</button>
                        </div>
                        <button class="remove-item-btn" data-name="${item.name}">Remove</button>`;
                    cartContainer.appendChild(itemElement);
                });

                if (totalPriceElement) {
                    totalPriceElement.textContent = totalPrice.toLocaleString();
                }
            }
        }
        
        cartContainer.addEventListener('click', (e) => {
            const target = e.target;
            const name = target.dataset.name;
            if (!name) return;

            let cart = getCart();
            let itemIndex = cart.findIndex(i => i.name === name);
            if (itemIndex === -1) return;

            if (target.classList.contains('quantity-btn')) {
                const action = target.dataset.action;
                if (action === 'increase') {
                    cart[itemIndex].quantity++;
                } else if (action === 'decrease') {
                    cart[itemIndex].quantity--;
                    if (cart[itemIndex].quantity <= 0) {
                        cart.splice(itemIndex, 1); // Remove item if quantity is 0 or less
                    }
                }
            } else if (target.classList.contains('remove-item-btn')) {
                cart.splice(itemIndex, 1);
            }
            saveCart(cart);
            renderCartPage();
        });
        
        if (checkoutLink) {
            checkoutLink.addEventListener('click', (e) => {
                if (!getLoggedInUser()) {
                    e.preventDefault();
                    showToast('Please log in to proceed.', true);
                    setTimeout(() => {
                        window.location.href = 'login.html?redirect=checkout';
                    }, 1500);
                }
            });
        }
        
        renderCartPage(); // Initial render
    }
    
    // CHECKOUT PAGE LOGIC
    if (document.querySelector('#checkout-page')) {
        const user = getLoggedInUser();
        const cart = getCart();

        // Guard clause: Redirect if not logged in or cart is empty
        if (!user || cart.length === 0) {
            window.location.href = 'cart.html';
            return; // Stop executing script for this page
        }

        const summaryItems = document.getElementById('summary-items');
        const summarySubtotal = document.getElementById('summary-subtotal');
        const summaryTotal = document.getElementById('summary-total');
        const paymentBtn = document.getElementById('payment-btn');
        const shippingForm = document.getElementById('shipping-form');
        const fullNameInput = document.getElementById('fullName');

        if (user && fullNameInput && user.name) {
            fullNameInput.value = user.name;
        }
        
        let subtotal = 0;
        summaryItems.innerHTML = '';
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            summaryItems.innerHTML += `<div class="summary-item"><span>${item.name} (x${item.quantity})</span><span>₹${itemTotal.toLocaleString()}</span></div>`;
        });
        summarySubtotal.textContent = `₹${subtotal.toLocaleString()}`;
        summaryTotal.textContent = `₹${subtotal.toLocaleString()}`;

        // The event listener is now async to handle the fetch request
        paymentBtn.addEventListener('click', async () => {
            if (!shippingForm.checkValidity()) {
                showToast('Please fill out all shipping details.', true);
                shippingForm.reportValidity();
                return;
            }

            // 1. Prepare the order data to send to the backend
            const orderData = {
                userId: user.id, // We get this from the logged-in user
                products: cart.map(item => ({ // Format the cart to match the backend schema
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                })),
                totalAmount: subtotal
            };

            try {
                // 2. Send the order to the backend to be saved
                const orderResponse = await fetch('http://localhost:3001/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(orderData)
                });

                const savedOrderData = await orderResponse.json();

                if (!orderResponse.ok) {
                    // If the backend returned an error, show it and stop.
                    showToast(savedOrderData.message || 'Could not save order.', true);
                    return;
                }

                // 3. If the order is saved successfully, PROCEED TO PAYMENT
                const options = {
                    "key": "rzp_test_RIdLQAHmxWHbQz", // Replace with your actual Razorpay Key ID
                    "amount": subtotal * 100,
                    "currency": "INR",
                    "name": "Ayush Enterprises",
                    "description": `Order ID: ${savedOrderData.order._id}`, // Use the real Order ID
                    "handler": function (response){
                        // This part runs ONLY after a successful payment
                        showToast(`Payment successful!`);
                        saveCart([]); // Clear the cart from localStorage
                        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
                    },
                    "prefill": { "name": fullNameInput.value, "email": user.email, "contact": document.getElementById('phone').value },
                    "theme": { "color": "#2c3e50" }
                };
                const rzp1 = new Razorpay(options);
                rzp1.open();

            } catch (error) {
                showToast('Could not connect to the server.', true);
                console.error('Order creation failed:', error);
            }
        });
    }

    // SIGNUP PAGE LOGIC
    if (document.getElementById('signup-form')) {
        document.getElementById('signup-form').addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop the form from refreshing the page

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // The data we will send to the backend
            const userData = {
                email: email,
                password: password,
            };

            try {
                // Use fetch() to send a POST request to our backend
                const response = await fetch('http://localhost:3001/api/users/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData),
                });

                const data = await response.json();
                console.log('Response from server:', data); // Log the server's response

                if (response.ok) { // response.ok is true if the request was successful
                    showToast(data.message); // "User created successfully!"
                    setTimeout(() => {
                        // Redirect to login so the user can log in
                        window.location.href = 'login.html';
                    }, 1500);
                } else {
                    // Show the error message from the server
                    showToast(data.message, true); // "User with this email already exists."
                }
            } catch (error) {
                showToast('Could not connect to the server.', true);
                console.error('Signup error:', error);
            }
        });
    }

    // LOGIN PAGE LOGIC
    if (document.getElementById('login-form')) {
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const userData = {
                email: email,
                password: password,
            };

            try {
                const response = await fetch('http://localhost:3001/api/users/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData),
                });

                const data = await response.json();
                console.log('Login response:', data);

                if (response.ok) {
                    // Login was successful! Save user info to localStorage.
                    saveLoggedInUser({ name: "User", email: data.user.email, id: data.user.id }); // Add the user's ID

                    showToast(data.message); // "Login successful!"
                    setTimeout(() => {
                        window.location.href = 'index.html'; // Redirect to homepage
                    }, 1500);
                } else {
                    showToast(data.message, true); // "Invalid credentials."
                }
            } catch (error) {
                showToast('Could not connect to the server.', true);
                console.error('Login error:', error);
            }
        });
    }

    // CONTACT PAGE LOGIC
    if (document.getElementById('contact-form')) {
        document.getElementById('contact-form').addEventListener('submit', function(e) {
            e.preventDefault();
            showToast("Thank you! Your message has been sent.");
            this.reset();
        });
    }

    // --- GLOBAL LOGIC ---
    // Fade-in animation for sections
    const hiddenElements = document.querySelectorAll('.hidden');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { 
            if (entry.isIntersecting) { 
                entry.target.classList.add('visible'); 
            } 
        });
    }, { threshold: 0.1 });
    hiddenElements.forEach((el) => observer.observe(el));
    
    // Initial UI updates on every page load
    updateCartCounter();
    updateHeaderUI();
});