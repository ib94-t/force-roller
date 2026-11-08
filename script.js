document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const whatsapp = "22389531845";
  const imageFiles = ["PH.jpeg", "PH1.jpeg", "PH2.jpeg", "PH3.jpeg", "PH4.jpeg", "PH5.jpeg", "PH6.jpeg", "PH7.jpeg", "PH8.jpeg", "PH9.jpeg"];
  const prices = [10000, 15000, 20000, 25000, 15000, 10000, 25000, 20000, 15000, 10000];
  const products = imageFiles.map((image, index) => ({
    id: index + 1,
    name: `Roller ${String(index + 1).padStart(2, "0")}`,
    image,
    price: prices[index],
    category: prices[index] >= 20000 ? "premium" : "budget"
  }));
  const grid = document.getElementById("productsGrid");
  const search = document.getElementById("productSearch");
  const count = document.getElementById("productCount");
  const emptyState = document.getElementById("emptyState");
  const filters = [...document.querySelectorAll(".filter-button")];
  const overlay = document.getElementById("cartOverlay");
  const drawer = document.getElementById("cartDrawer");
  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");
  const checkout = document.getElementById("checkoutButton");
  let activeFilter = "all";
  let previousFocus = null;
  let toastTimer;

  function priceText(value) { return `${value.toLocaleString("fr-FR")} FCFA`; }
  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem("forceRollerCart") || "[]");
      if (!Array.isArray(saved)) return [];
      return saved.filter(item => products.some(product => product.id === item.id) && Number.isInteger(item.quantity) && item.quantity > 0);
    } catch { return []; }
  }
  let cart = loadCart();
  function saveCart() {
    try { localStorage.setItem("forceRollerCart", JSON.stringify(cart)); } catch { /* Storage is optional. */ }
  }
  function notify(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2600);
  }
  const revealObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: 0.12, rootMargin: "0px 0px -35px 0px" })
    : null;
  function reveal(element) {
    element.classList.add("reveal");
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add("is-visible");
  }
  function productCard(product, index) {
    const card = document.createElement("article");
    card.className = "product-card";
    card.style.animationDelay = `${Math.min(index * 35, 210)}ms`;
    const imageWrap = document.createElement("div");
    imageWrap.className = "product-image-wrap";
    const image = document.createElement("img");
    image.className = "product-image";
    image.src = `images/${product.image}`;
    image.alt = `Patins à roulettes ${product.name}`;
    image.loading = "lazy";
    const number = document.createElement("span");
    number.className = "product-number";
    number.textContent = `N° ${String(product.id).padStart(2, "0")}`;
    const tag = document.createElement("span");
    tag.className = "product-price-tag";
    tag.textContent = priceText(product.price);
    imageWrap.append(image, number, tag);
    const info = document.createElement("div");
    info.className = "product-info";
    const category = document.createElement("p");
    category.className = "product-category";
    category.textContent = product.category === "premium" ? "SÉRIE SIGNATURE" : "FORCE ROLLER";
    const title = document.createElement("h3");
    title.className = "product-title";
    title.textContent = product.name;
    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = "Ton prochain tour commence ici.";
    const bottom = document.createElement("div");
    bottom.className = "product-card-bottom";
    const price = document.createElement("strong");
    price.className = "product-price";
    price.textContent = priceText(product.price);
    const add = document.createElement("button");
    add.type = "button";
    add.className = "add-to-cart";
    add.dataset.productId = product.id;
    add.setAttribute("aria-label", `Ajouter ${product.name} au panier`);
    add.textContent = "+";
    bottom.append(price, add);
    info.append(category, title, description, bottom);
    card.append(imageWrap, info);
    return card;
  }
  function renderProducts() {
    const query = search.value.trim().toLocaleLowerCase("fr");
    const shown = products.filter(product => {
      const matchesText = product.name.toLocaleLowerCase("fr").includes(query) || String(product.id).includes(query) || priceText(product.price).toLocaleLowerCase("fr").includes(query);
      return matchesText && (activeFilter === "all" || product.category === activeFilter);
    });
    grid.replaceChildren(...shown.map(productCard));
    grid.querySelectorAll(".product-card").forEach(reveal);
    count.textContent = `${shown.length} modèle${shown.length > 1 ? "s" : ""}`;
    emptyState.hidden = shown.length > 0;
  }
  function renderCart() {
    const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + products.find(product => product.id === item.id).price * item.quantity, 0);
    cartCount.textContent = quantity;
    cartTotal.textContent = priceText(total);
    checkout.disabled = quantity === 0;
    cartItems.replaceChildren();
    if (!cart.length) {
      const empty = document.createElement("div");
      empty.className = "cart-empty";
      const icon = document.createElement("span");
      icon.className = "cart-empty-icon";
      icon.textContent = "🛼";
      const title = document.createElement("h3");
      title.textContent = "Ton panier est vide";
      const message = document.createElement("p");
      message.textContent = "Choisis un modèle dans la collection pour commencer.";
      const browse = document.createElement("button");
      browse.type = "button";
      browse.className = "button button-dark";
      browse.dataset.action = "browse";
      browse.textContent = "Voir la collection";
      empty.append(icon, title, message, browse);
      cartItems.append(empty);
      saveCart();
      return;
    }
    cart.forEach(item => {
      const product = products.find(entry => entry.id === item.id);
      const row = document.createElement("article");
      row.className = "cart-item";
      const image = document.createElement("img");
      image.className = "cart-item-image";
      image.src = `images/${product.image}`;
      image.alt = `Patins ${product.name}`;
      const info = document.createElement("div");
      info.className = "cart-item-info";
      const title = document.createElement("h3");
      title.textContent = product.name;
      const price = document.createElement("p");
      price.textContent = priceText(product.price);
      const controls = document.createElement("div");
      controls.className = "quantity-controls";
      const minus = document.createElement("button");
      minus.type = "button";
      minus.dataset.action = "decrease";
      minus.dataset.productId = product.id;
      minus.setAttribute("aria-label", `Retirer une paire de ${product.name}`);
      minus.textContent = "−";
      const amount = document.createElement("span");
      amount.textContent = item.quantity;
      const plus = document.createElement("button");
      plus.type = "button";
      plus.dataset.action = "increase";
      plus.dataset.productId = product.id;
      plus.setAttribute("aria-label", `Ajouter une paire de ${product.name}`);
      plus.textContent = "+";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-item";
      remove.dataset.action = "remove";
      remove.dataset.productId = product.id;
      remove.textContent = "Supprimer";
      controls.append(minus, amount, plus, remove);
      info.append(title, price, controls);
      row.append(image, info);
      cartItems.append(row);
    });
    saveCart();
  }
  function openCart() {
    previousFocus = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    drawer.focus();
  }
  function closeCart() {
    overlay.hidden = true;
    document.body.style.overflow = "";
    previousFocus?.focus?.();
  }
  function openWhatsApp(message) {
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }
  grid.addEventListener("click", event => {
    const button = event.target.closest(".add-to-cart");
    if (!button) return;
    const product = products.find(item => item.id === Number(button.dataset.productId));
    const existing = cart.find(item => item.id === product.id);
    existing ? existing.quantity++ : cart.push({ id: product.id, quantity: 1 });
    renderCart();
    notify(`${product.name} ajouté au panier.`);
  });
  search.addEventListener("input", renderProducts);
  filters.forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filters.forEach(filter => {
      const selected = filter === button;
      filter.classList.toggle("active", selected);
      filter.setAttribute("aria-pressed", String(selected));
    });
    renderProducts();
  }));
  document.getElementById("cartButton").addEventListener("click", openCart);
  document.getElementById("closeCart").addEventListener("click", closeCart);
  document.getElementById("closeCartBackdrop").addEventListener("click", closeCart);
  cartItems.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.action === "browse") {
      closeCart();
      document.getElementById("collection").scrollIntoView({ behavior: "smooth" });
      return;
    }
    const item = cart.find(entry => entry.id === Number(button.dataset.productId));
    if (!item) return;
    if (button.dataset.action === "increase") item.quantity++;
    if (button.dataset.action === "decrease") item.quantity--;
    if (button.dataset.action === "remove" || item.quantity < 1) cart = cart.filter(entry => entry.id !== item.id);
    renderCart();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !overlay.hidden) closeCart();
  });
  checkout.addEventListener("click", () => {
    if (!cart.length) return;
    const lines = cart.map(item => {
      const product = products.find(entry => entry.id === item.id);
      return `• ${product.name} × ${item.quantity} — ${priceText(product.price * item.quantity)}`;
    });
    const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + products.find(product => product.id === item.id).price * item.quantity, 0);
    openWhatsApp(["Bonjour FORCE ROLLER !", "", "Je souhaite commander :", ...lines, "", `Nombre de paires : ${quantity}`, `Total estimé : ${priceText(total)}`, "", "Merci de confirmer la disponibilité et les modalités de livraison."].join("\n"));
  });
  document.getElementById("customOrderButton").addEventListener("click", event => {
    event.preventDefault();
    openWhatsApp("Bonjour FORCE ROLLER ! Je cherche un modèle de patins à roulettes sur commande, à partir de 50 000 FCFA. Pouvez-vous me présenter les options et les délais ?");
  });
  document.getElementById("contactWhatsapp").addEventListener("click", event => {
    event.preventDefault();
    openWhatsApp("Bonjour FORCE ROLLER ! J’aimerais un conseil pour choisir mes patins à roulettes.");
  });
  const menuToggle = document.getElementById("menuToggle");
  const nav = document.getElementById("navLinks");
  menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Ouvrir le menu");
  }));
  document.getElementById("currentYear").textContent = new Date().getFullYear();
  document.querySelectorAll(".perks, .section-heading, .custom-order, .manifesto, .contact-band").forEach(reveal);
  renderProducts();
  renderCart();
});
