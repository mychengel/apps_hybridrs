const API_BASE = "https://automatic-happiness-549jxj7rvgx27964-8000.app.github.dev/";
const TAX_RATE = 0.11; // PPN 11%

let cart = JSON.parse(localStorage.getItem("cart") || "[]");

document.addEventListener("DOMContentLoaded", () => {
  if (cart.length === 0) {
    window.location.href = "index.html";
    return;
  }
  renderOrderTable();
  renderPaymentSummary();
  fetchRecommendations();
});

// ===== Order Table =====
function renderOrderTable() {
  const tbody = document.getElementById("orderTableBody");
  tbody.innerHTML = cart.map(item => `
    <tr>
      <td>
        <img class="order-item-thumb" src="${item.image}" alt="${item.name}"
             onerror="this.src='images/others.png'"/>
      </td>
      <td>
        <div class="order-item-name">${item.name}</div>
        ${item.variant && item.variant !== "-"
          ? `<div class="order-item-variant">${item.variant}</div>` : ""}
        <div style="font-size:0.75rem;color:#9a7060">${item.category}</div>
      </td>
      <td style="text-align:right">${formatPrice(item.price)}</td>
      <td style="text-align:center;padding-left:12px;font-weight:700">${item.quantity}</td>
      <td style="text-align:right;font-weight:700;color:#7b4a2d">
        ${formatPrice(item.price * item.quantity)}
      </td>
    </tr>
  `).join("");
}

// ===== Payment Summary =====
function renderPaymentSummary() {
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;

  document.getElementById("paymentSummary").innerHTML = `
    <div class="pay-row">
      <span>Subtotal (${cart.reduce((s, i) => s + i.quantity, 0)} item)</span>
      <span>${formatPrice(subtotal)}</span>
    </div>
    <div class="pay-row tax">
      <span>PPN 11%</span>
      <span>${formatPrice(tax)}</span>
    </div>
    <div class="pay-row">
      <span>Biaya Layanan</span>
      <span>Gratis</span>
    </div>
    <div class="pay-row total">
      <span>Total Pembayaran</span>
      <span>${formatPrice(total)}</span>
    </div>
  `;
}

// ===== Fetch Recommendations =====
async function fetchRecommendations() {
  const cartPayload = cart.map(item => ({
    name: item.name,
    variant: item.variant === "-" ? undefined : item.variant,
    category: item.category,
    quantity: item.quantity,
  })).map(item => {
    if (!item.variant) delete item.variant;
    return item;
  });

  const body = { cart: cartPayload, top_n: 10 };

  try {
    const res = await fetch(`${API_BASE}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderRecommendations(data);
  } catch (err) {
    console.error("Recommendation error:", err);
    renderRecoError();
  }
}

// ===== Render Recommendations =====
function renderRecommendations(data) {
  const section = document.getElementById("recoSection");
  const top5 = (data.recommendations || []).slice(0, 5);

  if (top5.length === 0) {
    renderRecoError();
    return;
  }

  // Find image for each recommendation from PRODUCTS list
  function getRecoImage(productName, variant) {
    const match = PRODUCTS.find(
      p => p.name.toLowerCase() === productName.toLowerCase() &&
           (variant ? p.variant.toLowerCase() === variant.toLowerCase() : true)
    ) || PRODUCTS.find(p => p.name.toLowerCase() === productName.toLowerCase());
    return match ? match.image : "images/others.png";
  }

  const segmentHtml = data.customer_segment ? `
    <div class="segment-banner">
      <span class="segment-icon">👤</span>
      <div>
        <div class="segment-label">Segmen Pelanggan Anda</div>
        <div class="segment-value">${data.customer_segment}</div>
      </div>
    </div>` : "";

  const cardsHtml = top5.map(item => {
    const rating = item.scores?.layer3_bayesian_raw ?? 0;
    const isHighRating = rating > 4.0;
    const imgSrc = getRecoImage(item.product_name, item.variant);

    return `
      <div class="reco-card">
        <div class="reco-img-wrap">
          <img class="reco-img" src="${imgSrc}" alt="${item.product_name}"
               onerror="this.src='images/others.png'"/>
          ${isHighRating ? `
            <div class="reco-star-badge">
              ⭐ ${rating.toFixed(1)}
            </div>` : ""}
        </div>
        <div class="reco-body">
          <div class="reco-name">${item.product_name}</div>
          ${item.variant ? `<div class="reco-variant">${item.variant}</div>` : ""}
          <span class="reco-cat">${item.category}</span>
          <div class="reco-price">${formatPrice(item.price)}</div>
          <div class="reco-rating">
            ${getRatingStars(rating)}
            <span>${rating.toFixed(1)}</span>
          </div>
        </div>
      </div>`;
  }).join("");

  section.innerHTML = `
    <div class="section-title">✨ Mungkin Anda Mau Mencoba?</div>
    <p class="reco-intro">Pilihan spesial untukmu berdasarkan pesanan saat ini &mdash; jangan sampai terlewat!</p>
    ${segmentHtml}
    <div class="reco-scroll">${cardsHtml}</div>
  `;
}

function getRatingStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  let stars = "";
  for (let i = 0; i < 5; i++) {
    if (i < full) stars += "★";
    else if (i === full && half) stars += "½";
    else stars += "☆";
  }
  return `<span style="color:#e8a940;font-size:0.8rem">${stars}</span>`;
}

function renderRecoError() {
  document.getElementById("recoSection").innerHTML = `
    <div class="section-title">✨ Rekomendasi untuk Anda</div>
    <div class="reco-error">
      <div class="reco-error-icon">🔌</div>
      <p>Layanan rekomendasi sedang tidak tersedia.<br/>
      <span style="font-size:0.78rem">Silakan lanjutkan pembelian.</span></p>
    </div>
  `;
}

// ===== Checkout Action =====
function handleCheckout() {
  document.getElementById("successModal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function resetAndGoHome() {
  localStorage.removeItem("cart");
  window.location.href = "index.html";
}

// Close success modal on overlay click
document.getElementById("successModal").addEventListener("click", function(e) {
  if (e.target === this) resetAndGoHome();
});
