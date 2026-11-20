  // Rok w stopce
  document.getElementById('year').textContent = new Date().getFullYear();

  // Mobilne menu
  var burger = document.getElementById('burgerBtn');
  var nav = document.getElementById('navLinks');
  burger.addEventListener('click', function () {
    nav.classList.toggle('open');
  });
  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { nav.classList.remove('open'); });
  });

  // Przełącznik zakładek: rezerwacja / zamówienie
  var tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
      document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
    });
  });

  // Dostawa / odbiór — przełącznik w formularzu zamówienia
  var deliveryBtns = document.querySelectorAll('.delivery-options button');
  var addressLabel = document.getElementById('addressLabel');
  var addressInput = document.getElementById('addressInput');
  deliveryBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      deliveryBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      if (btn.dataset.mode === 'odbior') {
        addressLabel.textContent = 'Adres (opcjonalnie)';
        addressInput.required = false;
        addressInput.placeholder = 'Odbiór osobisty — adres niepotrzebny';
      } else {
        addressLabel.textContent = 'Adres dostawy';
        addressInput.required = true;
        addressInput.placeholder = 'Ulica, numer domu/mieszkania, Ząbki';
      }
    });
  });

  // ---------- KOSZYK ZAMÓWIEŃ ----------
  var CART_KEY = 'esencjaCart_v1';

  function loadCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  }
  function getMenuItems() {
    var items = {};
    document.querySelectorAll('.menu-card[data-id]').forEach(function (card) {
      items[card.dataset.id] = {
        name: card.dataset.name,
        price: parseFloat(card.dataset.price)
      };
    });
    return items;
  }
  function formatPrice(n) { return n.toFixed(0) + ' zł'; }
  function cartCount() {
    return Object.keys(cart).reduce(function (sum, id) { return sum + cart[id]; }, 0);
  }
  function cartTotal() {
    var total = 0;
    Object.keys(cart).forEach(function (id) {
      if (MENU_ITEMS[id]) total += MENU_ITEMS[id].price * cart[id];
    });
    return total;
  }
  function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    renderCart();
  }
  function changeQty(id, delta) {
    if (!cart[id]) return;
    cart[id] += delta;
    if (cart[id] <= 0) delete cart[id];
    saveCart();
    renderCart();
  }
  function removeFromCart(id) {
    delete cart[id];
    saveCart();
    renderCart();
  }
  function clearCart() {
    cart = {};
    saveCart();
    renderCart();
  }

  var MENU_ITEMS = getMenuItems();
  var cart = loadCart();
  // Usuń z koszyka pozycje, których już nie ma w menu (np. po edycji strony)
  Object.keys(cart).forEach(function (id) { if (!MENU_ITEMS[id]) delete cart[id]; });

  var cartCountEl = document.getElementById('cartCount');
  var cartItemsEl = document.getElementById('cartItems');
  var cartTotalEl = document.getElementById('cartTotal');
  var orderSummaryEl = document.getElementById('orderSummary');

  function renderCart() {
    var ids = Object.keys(cart);
    cartCountEl.textContent = cartCount();

    if (ids.length === 0) {
      cartItemsEl.innerHTML = '<div class="cart-empty">Koszyk jest pusty — dodaj dania z menu.</div>';
    } else {
      cartItemsEl.innerHTML = ids.map(function (id) {
        var item = MENU_ITEMS[id];
        var lineTotal = item.price * cart[id];
        return '<div class="cart-item">' +
          '<div class="name">' + item.name + '<small>' + formatPrice(item.price) + ' / szt.</small></div>' +
          '<div class="qty-stepper">' +
            '<button type="button" data-qty-minus="' + id + '" aria-label="Mniej">−</button>' +
            '<span>' + cart[id] + '</span>' +
            '<button type="button" data-qty-plus="' + id + '" aria-label="Więcej">+</button>' +
          '</div>' +
          '<div class="line-total">' + formatPrice(lineTotal) + '</div>' +
          '<button type="button" class="remove" data-remove="' + id + '">usuń</button>' +
        '</div>';
      }).join('');

      cartItemsEl.querySelectorAll('[data-qty-plus]').forEach(function (b) {
        b.addEventListener('click', function () { changeQty(b.dataset.qtyPlus, 1); });
      });
      cartItemsEl.querySelectorAll('[data-qty-minus]').forEach(function (b) {
        b.addEventListener('click', function () { changeQty(b.dataset.qtyMinus, -1); });
      });
      cartItemsEl.querySelectorAll('[data-remove]').forEach(function (b) {
        b.addEventListener('click', function () { removeFromCart(b.dataset.remove); });
      });
    }
    cartTotalEl.textContent = formatPrice(cartTotal());

    // Podsumowanie wewnątrz formularza zamówienia (zakładka "Zamówienie")
    if (ids.length === 0) {
      orderSummaryEl.innerHTML = '<div class="empty">Koszyk jest pusty — wróć do sekcji <a href="#menu" style="color:var(--accent-dark); text-decoration:underline;">Menu</a> i dodaj dania, klikając „Dodaj do koszyka".</div>';
    } else {
      var lines = ids.map(function (id) {
        var item = MENU_ITEMS[id];
        return '<div class="line"><span>' + cart[id] + '× ' + item.name + '</span><span>' + formatPrice(item.price * cart[id]) + '</span></div>';
      }).join('');
      orderSummaryEl.innerHTML = lines + '<div class="line total"><span>Razem</span><span>' + formatPrice(cartTotal()) + '</span></div>';
    }
  }

  // Przyciski "Dodaj do koszyka" na kartach menu
  document.querySelectorAll('.menu-card [data-add]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.menu-card');
      addToCart(card.dataset.id);
      var original = btn.textContent;
      btn.textContent = 'Dodano ✓';
      btn.classList.add('added');
      setTimeout(function () { btn.textContent = original; btn.classList.remove('added'); }, 1100);
    });
  });

  // Otwieranie / zamykanie panelu koszyka
  var cartOverlay = document.getElementById('cartOverlay');
  document.getElementById('cartBtn').addEventListener('click', function () { cartOverlay.classList.add('open'); });
  document.getElementById('cartCloseBtn').addEventListener('click', function () { cartOverlay.classList.remove('open'); });
  cartOverlay.addEventListener('click', function (e) { if (e.target === cartOverlay) cartOverlay.classList.remove('open'); });

  // "Przejdź do zamówienia" — zamyka koszyk, przełącza na zakładkę Zamówienie i przewija do sekcji
  document.getElementById('cartCheckoutBtn').addEventListener('click', function () {
    cartOverlay.classList.remove('open');
    tabBtns.forEach(function (b) { b.classList.remove('active'); });
    document.querySelector('.tab-btn[data-tab="zamowienie"]').classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
    document.getElementById('panel-zamowienie').classList.add('active');
    document.getElementById('zamowienia').scrollIntoView({ behavior: 'smooth' });
  });

  renderCart();

  // ---------- FORMULARZE ----------
  // Rezerwacja — placeholder wizualny (podpiąć realną obsługę przed wdrożeniem)
  var reserveForm = document.getElementById('reserveForm');
  var reserveMsg = document.getElementById('reserveMsg');
  reserveForm.addEventListener('submit', function (e) {
    e.preventDefault();
    reserveMsg.style.display = 'block';
    reserveForm.reset();
  });

  // Zamówienie — wymaga co najmniej jednego dania w koszyku; po wysłaniu koszyk się czyści
  var orderForm = document.getElementById('orderForm');
  var orderMsg = document.getElementById('orderMsg');
  orderForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (Object.keys(cart).length === 0) {
      orderMsg.style.background = '#a6392e';
      orderMsg.textContent = 'Koszyk jest pusty — dodaj przynajmniej jedno danie z sekcji Menu, zanim wyślesz zamówienie.';
      orderMsg.style.display = 'block';
      return;
    }
    var itemsText = Object.keys(cart).map(function (id) {
      return cart[id] + '× ' + MENU_ITEMS[id].name;
    }).join(', ');
    orderMsg.style.background = 'var(--accent-dark)';
    orderMsg.textContent = 'Dziękujemy za zamówienie (' + itemsText + ', razem ' + formatPrice(cartTotal()) + ')! Zadzwonimy, aby je potwierdzić i podać czas realizacji.';
    orderMsg.style.display = 'block';
    orderForm.reset();
    clearCart();
  });
