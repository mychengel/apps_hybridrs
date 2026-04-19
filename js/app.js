// ===== Cart State =====
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

// ===== Filter State =====
let activeCategory = "Semua";
let activeVariant = "Semua";

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  buildCategoryChips();
  buildVariantSelect();
  renderProducts();
  updateCartBadge();
});

// ===== Category Chips =====
function buildCategoryChips() {
  const container = document.getElementById("catChips");
  CATEGORIES.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "chip" + (cat === "Semua" ? " active" : "");
    btn.textContent = cat;
    btn.onclick = () => {
      activeCategory = cat;
      document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      renderProducts();
    };
    container.appendChild(btn);
  });
}

// ===== Variant Select =====
function buildVariantSelect() {
  const sel = document.getElementById("variantSelect");
  getVariants().forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v === "Semua" ? "Semua Varian" : v;
    sel.appendChild(opt);
  });
  sel.onchange = () => {
    activeVariant = sel.value;
    renderProducts();
  };
}

// ===== Product Rendering =====
function renderProducts() {
  const grid = document.getElementById("productGrid");
  let filtered = PRODUCTS;

  if (activeCategory !== "Semua") {
    filtered = filtered.filter(p => p.category === activeCategory);
  }
  if (activeVariant !== "Semua") {
    filtered = filtered.filter(p => p.variant === activeVariant);
  }

  document.getElementById("filterCount").textContent =
    filtered.length + " produk";

  grid.innerHTML = "";

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <p>Tidak ada produk yang sesuai filter.</p>
      </div>`;
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-img-wrap">
        <img class="product-img" src="${p.image}" alt="${p.name}" loading="lazy"
             style="background-color: #ffffff;object-fit: contain;" onerror="this.src='images/others.png'"/>
        <span class="category-badge">${p.category}</span>
      </div>
      <div class="product-body">
        <div class="product-name">${p.name}</div>
        ${p.variant && p.variant !== "-" ? `<div class="product-variant">${p.variant}</div>` : ""}
        <div class="product-price">${formatPrice(p.price)}</div>
        <button class="btn-add" onclick="addToCart(${p.id})">
          <span>+</span> Tambah ke Keranjang
        </button>
      </div>`;
    grid.appendChild(card);
  });
}

// ===== Cart Logic =====
function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(
    i => i.id === productId && i.variant === product.variant
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      variant: product.variant,
      category: product.category,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
  }

  saveCart();
  updateCartBadge();
  showToast(`"${product.name}" ditambahkan ke keranjang!`);

  const fab = document.getElementById("cartFab");
  fab.classList.remove("bump");
  void fab.offsetWidth;
  fab.classList.add("bump");
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartBadge();
  renderCartBody();
}

function changeQty(index, delta) {
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) {
    removeFromCart(index);
    return;
  }
  saveCart();
  renderCartBody();
  updateCartBadge();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartBadge() {
  const total = cart.reduce((sum, i) => sum + i.quantity, 0);
  document.getElementById("cartBadge").textContent = total;
}

function getTotalPrice() {
  return cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

// ===== Cart Modal =====
function openCartModal() {
  renderCartBody();
  document.getElementById("cartModal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeCartModal() {
  document.getElementById("cartModal").classList.remove("open");
  document.body.style.overflow = "";
}

document.getElementById("cartModal").addEventListener("click", function(e) {
  if (e.target === this) closeCartModal();
});

function renderCartBody() {
  const body = document.getElementById("cartBody");
  const footer = document.getElementById("cartFooter");

  if (cart.length === 0) {
    body.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>Keranjang masih kosong.</p>
        <p style="font-size:0.82rem;margin-top:6px;color:#9a7060">Tambahkan produk favoritmu!</p>
      </div>`;
    footer.style.display = "none";
    return;
  }

  footer.style.display = "block";

  body.innerHTML = cart.map((item, idx) => `
    <div class="cart-item">
      <img class="cart-item-img" src="${item.image}" alt="${item.name}"
           onerror="this.src='images/others.png'"/>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        ${item.variant && item.variant !== "-"
          ? `<div class="cart-item-variant">${item.variant}</div>` : ""}
        <div class="cart-item-price">${formatPrice(item.price)}</div>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" onclick="changeQty(${idx}, -1)">−</button>
        <span class="qty-num">${item.quantity}</span>
        <button class="qty-btn" onclick="changeQty(${idx}, 1)">+</button>
      </div>
      <div class="cart-item-subtotal">${formatPrice(item.price * item.quantity)}</div>
    </div>
  `).join("");

  document.getElementById("cartTotal").textContent = formatPrice(getTotalPrice());
}

// ===== Checkout Navigate =====
function goToCheckout() {
  if (cart.length === 0) return;
  saveCart();
  closeCartModal();
  window.location.href = "checkout.html";
}

// ===== Toast =====
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2200);
}
