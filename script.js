// script.js
document.addEventListener('DOMContentLoaded', () => {
  const dishesContainer = document.getElementById('dishes-container');
  const menuTabs = document.getElementById('menuTabs');
  const searchInput = document.getElementById('dish-search');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const cartItemCount = document.getElementById('cart-item-count');
  const cartItemsList = document.getElementById('cart-items');
  const cartTotalDisplay = document.getElementById('cart-total');
  const emptyCartMessage = document.getElementById('empty-cart-message');
  const noResultsMessage = document.getElementById('no-results-message');

  const bookingCartItems = document.getElementById('booking-cart-items');
  const bookingCartTotal = document.getElementById('booking-cart-total');
  const bookingEmptyCart = document.getElementById('booking-empty-cart');
  const confirmOrderBtn = document.getElementById('confirm-order-btn');

  let menuData = [];
  let currentCategory = 'all';
  let activeFilters = new Set();
  let cart = JSON.parse(localStorage.getItem('italianoCart')) || {};

  async function loadMenu() {
    try {
      const response = await fetch('menu.json');
      menuData = await response.json();
      renderMenu();
      updateCartDisplay();
    } catch (error) {
      console.error('Помилка завантаження меню:', error);
      dishesContainer.innerHTML = '<p class="text-center text-danger">Не вдалося завантажити меню.</p>';
    }
  }

  function renderMenu() {
    dishesContainer.innerHTML = '';
    noResultsMessage.classList.add('d-none');

    const searchValue = searchInput.value.toLowerCase().trim();

    const filteredDishes = menuData.filter(dish => {
      const categoryMatch = currentCategory === 'all' || dish.category === currentCategory;

      const searchMatch = !searchValue ||
        dish.name.toLowerCase().includes(searchValue) ||
        dish.ingredients.some(ing => ing.toLowerCase().includes(searchValue));

      const filterMatch = Array.from(activeFilters).every(filterKey => dish[filterKey] === true);

      return categoryMatch && searchMatch && filterMatch;
    });

    if (filteredDishes.length === 0) {
      noResultsMessage.classList.remove('d-none');
      return;
    }

    filteredDishes.forEach(dish => {
      const cardHtml = `
        <div class="col-md-4 dish-card" data-id="${dish.id}">
          <div class="menu__card card h-100">
            <img src="${dish.image}" class="card-img-top" alt="${dish.name}" />
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${dish.name}</h5>
              <p class="card-text text-muted small">${dish.ingredients.join(', ')}</p>
              <div class="mt-auto d-flex justify-content-between align-items-center">
                <div class="menu__price">${dish.price} грн</div>
                <button class="btn btn-sm add-to-cart-btn" data-id="${dish.id}" data-name="${dish.name}" data-price="${dish.price}">
                  <i class="fas fa-plus"></i> Додати
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      dishesContainer.insertAdjacentHTML('beforeend', cardHtml);
    });
  }

  menuTabs.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (button && button.dataset.category) {
      document.querySelectorAll('.menu__tabs button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      currentCategory = button.dataset.category;
      renderMenu();
    }
  });

  searchInput.addEventListener('input', renderMenu);

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;

      if (activeFilters.has(filter)) {
        activeFilters.delete(filter);
        button.classList.remove('active');
      } else {
        activeFilters.add(filter);
        button.classList.add('active');
      }

      renderMenu();
    });
  });

  dishesContainer.addEventListener('click', (e) => {
    const button = e.target.closest('.add-to-cart-btn');
    if (button) {
      const id = button.dataset.id;
      const name = button.dataset.name;
      const price = parseFloat(button.dataset.price);

      if (cart[id]) {
        cart[id].quantity++;
      } else {
        cart[id] = { id, name, price, quantity: 1 };
      }

      saveCart();
      updateCartDisplay();
    }
  });

  function saveCart() {
    localStorage.setItem('italianoCart', JSON.stringify(cart));
  }

  function updateCartDisplay() {
    cartItemsList.innerHTML = '';
    bookingCartItems.innerHTML = '';

    let totalItems = 0;
    let totalPrice = 0;

    const itemKeys = Object.keys(cart);
    const hasItems = itemKeys.length > 0;

    emptyCartMessage.classList.toggle('d-none', hasItems);
    bookingEmptyCart.classList.toggle('d-none', hasItems);
    document.getElementById('place-order-btn').disabled = !hasItems;
    confirmOrderBtn.disabled = !hasItems;

    itemKeys.forEach(id => {
      const item = cart[id];
      const itemTotal = item.price * item.quantity;
      totalItems += item.quantity;
      totalPrice += itemTotal;

      const itemHtml = `
        <div class="d-flex justify-content-between align-items-center mb-2 cart-item" data-id="${id}">
          <div>
            <span class="fw-bold">${item.name}</span> <span class="badge bg-secondary">${item.quantity}x</span>
            <div class="small text-muted">${item.price} грн</div>
          </div>
          <div class="d-flex align-items-center">
            <span class="fw-bold me-3">${itemTotal} грн</span>
            <button class="btn btn-sm btn-danger remove-item-btn" data-id="${id}" title="Видалити 1">
              <i class="fas fa-minus"></i>
            </button>
          </div>
        </div>
      `;
      cartItemsList.insertAdjacentHTML('beforeend', itemHtml);

      const bookingItemHtml = `
        <div class="d-flex justify-content-between align-items-center mb-2 cart-item" data-id="${id}">
          <div>
            <span class="fw-bold text-dark">${item.name}</span> <span class="badge bg-secondary">${item.quantity}x</span>
            <div class="small text-muted">${item.price} грн</div>
          </div>
          <div class="d-flex align-items-center">
            <span class="fw-bold me-2 text-dark">${itemTotal} грн</span>
            <button class="btn btn-sm btn-danger remove-item-booking-btn" data-id="${id}" title="Видалити 1">
              <i class="fas fa-minus"></i>
            </button>
          </div>
        </div>
      `;
      bookingCartItems.insertAdjacentHTML('beforeend', bookingItemHtml);
    });

    cartItemCount.textContent = totalItems;
    cartTotalDisplay.textContent = `${totalPrice} грн`;
    bookingCartTotal.textContent = `${totalPrice} грн`;
  }


  cartItemsList.addEventListener('click', (e) => {
    const button = e.target.closest('.remove-item-btn');
    if (button) {
      const id = button.dataset.id;
      removeFromCart(id);
    }
  });


  bookingCartItems.addEventListener('click', (e) => {
    const button = e.target.closest('.remove-item-booking-btn');
    if (button) {
      const id = button.dataset.id;
      removeFromCart(id);
    }
  });


  function removeFromCart(id) {
    if (cart[id]) {
      cart[id].quantity--;
      if (cart[id].quantity <= 0) {
        delete cart[id];
      }
      saveCart();
      updateCartDisplay();
    }
  }

  loadMenu();



  const bookingForm = document.getElementById('booking-form');
  const bookingDateInput = document.getElementById('booking-date');
  const bookingTimeInput = document.getElementById('booking-time');
  const bookingTableSelect = document.getElementById('booking-table');

  const availableHours = {
    minTime: "12:00",
    maxTime: "22:00",
    time_24hr: true
  };

  flatpickr(bookingDateInput, {
    dateFormat: "Y-m-d",
    minDate: "today",
    locale: 'uk',
    onChange: function (selectedDates, dateStr, instance) {
      validateField(bookingDateInput);
    }
  });

  flatpickr(bookingTimeInput, {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: availableHours.time_24hr,
    minTime: availableHours.minTime,
    maxTime: availableHours.maxTime,
    locale: 'uk',
    onChange: function (selectedDates, dateStr, instance) {
      validateField(bookingTimeInput);
    }
  });

  function validateField(input) {
    if (!input.checkValidity()) {
      input.classList.add('is-invalid');
      input.classList.remove('is-valid');
      return false;
    } else {
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
      return true;
    }
  }

  bookingForm.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    let isValid = true;
    const formInputs = this.querySelectorAll('input[required], select[required]');

    formInputs.forEach(input => {
      if (!validateField(input)) {
        isValid = false;
      }
    });

    if (isValid) {
      const tableName = bookingTableSelect.options[bookingTableSelect.selectedIndex].text;

      alert(`Бронювання прийнято!\nІм'я: ${document.getElementById('booking-name').value}\nДата: ${bookingDateInput.value}\nЧас: ${bookingTimeInput.value}\nГостей: ${document.getElementById('booking-guests').value}\nСтолик: ${tableName}`);

      bookingForm.reset();
      formInputs.forEach(input => {
        input.classList.remove('is-valid', 'is-invalid');
      });
    }

    bookingForm.classList.add('was-validated');
  });

  bookingForm.querySelectorAll('input[required], select[required]').forEach(input => {
    input.addEventListener('input', () => validateField(input));
    input.addEventListener('change', () => validateField(input));
  });

  confirmOrderBtn.addEventListener('click', () => {
    let isValid = true;
    const formInputs = bookingForm.querySelectorAll('input[required], select[required]');

    formInputs.forEach(input => {
      if (!validateField(input)) {
        isValid = false;
      }
    });

    if (!isValid) {
      alert('Будь ласка, заповніть усі поля форми бронювання.');
      bookingForm.classList.add('was-validated');
      return;
    }

    const tableName = bookingTableSelect.options[bookingTableSelect.selectedIndex].text;
    const itemKeys = Object.keys(cart);
    let orderSummary = 'Ваше замовлення:\n';

    itemKeys.forEach(id => {
      const item = cart[id];
      orderSummary += `${item.name} x${item.quantity} - ${item.price * item.quantity} грн\n`;
    });

    orderSummary += `\nЗагальна сума: ${bookingCartTotal.textContent}`;

    alert(`Бронювання та замовлення підтверджено!\n\nІм'я: ${document.getElementById('booking-name').value}\nДата: ${bookingDateInput.value}\nЧас: ${bookingTimeInput.value}\nГостей: ${document.getElementById('booking-guests').value}\nСтолик: ${tableName}\n\n${orderSummary}`);

    cart = {};
    saveCart();
    updateCartDisplay();
    bookingForm.reset();
    formInputs.forEach(input => {
      input.classList.remove('is-valid', 'is-invalid');
    });
    bookingForm.classList.remove('was-validated');
  });



  const galleryItems = document.querySelectorAll('#interior-gallery .gallery__item');
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImage = document.getElementById('lightbox-image-display');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxBackdrop = document.getElementById('lightbox-backdrop');

  let currentImageIndex = 0;
  const imageSources = Array.from(galleryItems).map(item => item.dataset.src);
  const bsLightboxModal = new bootstrap.Modal(lightboxModal);



  function openLightbox(index) {
    currentImageIndex = index;
    lightboxImage.src = imageSources[currentImageIndex];
    bsLightboxModal.show();
  }

  function showNextImage() {
    currentImageIndex = (currentImageIndex + 1) % imageSources.length;
    lightboxImage.src = imageSources[currentImageIndex];
  }

  function showPrevImage() {
    currentImageIndex = (currentImageIndex - 1 + imageSources.length) % imageSources.length;
    lightboxImage.src = imageSources[currentImageIndex];
  }

  galleryItems.forEach((item, index) => {
    item.querySelector('.gallery__img').addEventListener('click', () => {
      openLightbox(index);
    });
  });

  lightboxNext.addEventListener('click', (e) => {
    e.stopPropagation();
    showNextImage();
  });

  lightboxPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    showPrevImage();
  });

  lightboxBackdrop.addEventListener('click', (e) => {
    if (e.target === lightboxBackdrop || e.target === lightboxImage) {
      bsLightboxModal.hide();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (bsLightboxModal._isShown) {
      if (e.key === 'Escape') {
        bsLightboxModal.hide();
      } else if (e.key === 'ArrowRight') {
        showNextImage();
      } else if (e.key === 'ArrowLeft') {
        showPrevImage();
      }
    }
  });

});