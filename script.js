document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('menuToggle');
    const nav = document.getElementById('mainNav');
    const menuEl = document.getElementById('menu');
    const cartList = document.getElementById('cartList');
    const totalLabel = document.getElementById('totalLabel');
    const coordsEl = document.getElementById('coords');
    const locBtn = document.getElementById('locBtn');
    const manualBtn = document.getElementById('manualBtn');
    const placeOrderBtn = document.getElementById('placeOrder');
    const searchInput = document.getElementById('searchInput');

    const menuItems = [
        { id: 'shawarma-1', category: 'shawarma', name: 'Chicken Shawarma (Medium)', price: 4000, desc: 'Juicy chicken with fresh veg & special sauce' },
        { id: 'shawarma-2', category: 'shawarma', name: 'Beef Shawarma (Large)', price: 5000, desc: 'Tender beef, extra filling' },
        { id: 'burger-1', category: 'burger', name: 'Zinger Burger', price: 3000, desc: 'Crispy spicy chicken patty' },
        { id: 'burger-2', category: 'burger', name: 'Cheese Burger', price: 3500, desc: 'Melted cheese, house sauce' },
        { id: 'fries-1', category: 'fries', name: 'Classic Loaded Fries', price: 4500, desc: 'Fries, cheese, chicken bits & sauce' },
        { id: 'drinks-1', category: 'drinks', name: 'Coca Cola (500ml)', price: 500, desc: 'Chilled beverage' }
    ];

    const cart = {};
    let pickup = null;

    function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

    function renderMenu(items = menuItems){
        menuEl.innerHTML = '';
        for(const it of items){
            const card = document.createElement('article');
            card.className = 'card';
            card.dataset.category = it.category;
            card.innerHTML = `
                <div class="thumb" aria-hidden="true"></div>
                <div class="item-header">
                    <div class="item-name">${escapeHtml(it.name)}</div>
                    <div class="price">₦${Number(it.price).toLocaleString()}</div>
                </div>
                <div class="item-desc small">${escapeHtml(it.desc)}</div>
                <div class="item-row">
                    <button class="btn primary" data-id="${it.id}">Add</button>
                </div>
            `;
            menuEl.appendChild(card);
        }
    }

    function addToCart(id){
        const it = menuItems.find(x=>x.id===id);
        if(!it) return;
        if(!cart[id]) cart[id] = {...it, qty:0};
        cart[id].qty++;
        updateCart();
    }

    function changeQty(id, delta){
        if(!cart[id]) return;
        cart[id].qty += delta;
        if(cart[id].qty <= 0) delete cart[id];
        updateCart();
    }

    function updateCart(){
        cartList.innerHTML = '';
        const keys = Object.keys(cart);
        if(keys.length === 0){
            cartList.innerHTML = '<div class="small">No items yet</div>';
        } else {
            for(const k of keys){
                const it = cart[k];
                const row = document.createElement('div');
                row.className = 'cart-item';
                row.innerHTML = `
                    <div>
                        <div style="font-weight:600">${escapeHtml(it.name)}</div>
                        <div class="small">₦${Number(it.price).toLocaleString()} each</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                        <div class="qty small">
                            <button class="btn ghost small" data-change="${it.id}" data-delta="-1">-</button>
                            <div style="min-width:28px;text-align:center">${it.qty}</div>
                            <button class="btn ghost small" data-change="${it.id}" data-delta="1">+</button>
                        </div>
                        <div style="min-width:80px;text-align:right;font-weight:700">₦${Number(it.price*it.qty).toLocaleString()}</div>
                    </div>
                `;
                cartList.appendChild(row);
            }
        }
        const total = Object.values(cart).reduce((s,i)=>s + i.price * i.qty,0);
        totalLabel.textContent = `Total: ₦${Number(total).toLocaleString()}`;
    }

    function setPickup(lat, lon){
        pickup = {lat, lon};
        coordsEl.innerHTML = `Pickup coordinates: <strong>${lat.toFixed(6)}</strong>, <strong>${lon.toFixed(6)}</strong>
            <div style="margin-top:6px"><a href="https://maps.google.com/?q=${lat},${lon}" target="_blank">Open in Google Maps</a></div>`;
    }

    // Event wiring
    if(btn && nav){
        btn.addEventListener('click', ()=>{
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', String(!expanded));
            nav.classList.toggle('open');
        });
    }

    // delegate add buttons
    menuEl.addEventListener('click', (ev)=>{
        const t = ev.target.closest('button[data-id]');
        if(t) addToCart(t.dataset.id);
    });

    // delegate qty change
    cartList.addEventListener('click', (ev)=>{
        const t = ev.target.closest('button[data-change]');
        if(!t) return;
        const id = t.dataset.change;
        const delta = Number(t.dataset.delta || 0);
        changeQty(id, delta);
    });

    locBtn.addEventListener('click', ()=>{
        if(!navigator.geolocation){ coordsEl.textContent = 'Geolocation not supported'; return; }
        coordsEl.textContent = 'Retrieving location...';
        navigator.geolocation.getCurrentPosition(pos=>{
            setPickup(pos.coords.latitude, pos.coords.longitude);
        }, err=>{ coordsEl.textContent = 'Could not get location: ' + (err.message || err.code); }, {enableHighAccuracy:true, timeout:10000});
    });

    manualBtn.addEventListener('click', ()=>{
        const lat = parseFloat(prompt('Enter pickup latitude (e.g. 6.5244)'));
        const lon = parseFloat(prompt('Enter pickup longitude (e.g. 3.3792)'));
        if(Number.isFinite(lat) && Number.isFinite(lon)) setPickup(lat, lon);
        else coordsEl.textContent = 'Invalid coordinates';
    });

    placeOrderBtn.addEventListener('click', ()=>{
        const items = Object.values(cart);
        if(items.length === 0){ alert('Cart is empty'); return; }
        if(!pickup){ alert('Please set pickup coordinates'); return; }
        const order = { items: items.map(i=>({id:i.id,name:i.name,qty:i.qty,price:i.price})), total: items.reduce((s,i)=>s+i.price*i.qty,0), pickup };
        alert('Order placed\n' + JSON.stringify(order,null,2));
        for(const k of Object.keys(cart)) delete cart[k];
        updateCart();
    });

    // Filters & search
    document.querySelectorAll('.filter-btn').forEach(b => b.addEventListener('click', (e)=>{
        document.querySelectorAll('.filter-btn').forEach(x=>x.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const f = e.currentTarget.dataset.filter;
        applyFilterAndSearch(f, searchInput.value.trim());
    }));

    searchInput.addEventListener('input', (e)=>{
        const active = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        applyFilterAndSearch(active, e.target.value.trim());
    });

    function applyFilterAndSearch(filter, query){
        const q = String(query || '').toLowerCase();
        const nodes = [];
        for(const it of menuItems){
            const matchesFilter = (filter === 'all') || it.category === filter;
            const matchesQuery = q === '' || it.name.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q);
            if(matchesFilter && matchesQuery) nodes.push(it);
        }
        renderMenu(nodes);
    }

    // hero CTAs smooth scroll
    const ctaOrder = document.getElementById('ctaOrder');
    const ctaMenu = document.getElementById('ctaMenu');
    function scrollToMenu(){ menuEl.scrollIntoView({behavior:'smooth',block:'start'}); }
    if(ctaOrder) ctaOrder.addEventListener('click', scrollToMenu);
    if(ctaMenu) ctaMenu.addEventListener('click', scrollToMenu);

    // initial render
    renderMenu();
    updateCart();
});