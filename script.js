// Auth and State Management
const Auth = {
  login: (email, role = null, name = null) => {
    // Retrieve profile data (including role if it was stored during registration)
    const profileKey = `profile_${email}`;
    const storedProfile = JSON.parse(localStorage.getItem(profileKey)) || {};

    // If a name is provided (from registration), save it along with the role
    if (name || role) {
      const updatedProfile = {
        name: name || storedProfile.name || email.split("@")[0],
        role: role || storedProfile.role || "client", // default to client if no role
        image: storedProfile.image || null,
      };
      localStorage.setItem(profileKey, JSON.stringify(updatedProfile));
    }

    const finalProfile = JSON.parse(localStorage.getItem(profileKey)) || {
      name: email.split("@")[0],
      role: "client",
      image: null,
    };

    localStorage.setItem(
      "user",
      JSON.stringify({
        email,
        role: finalProfile.role,
        loggedIn: true,
        ...finalProfile,
      }),
    );

    window.location.href =
      finalProfile.role === "owner"
        ? "dashboard-owner.html"
        : "dashboard-client.html";
  },
  register: (email, role, name) => {
    if (Auth.accountExists(email)) {
      return {
        success: false,
        message: "An account with this email already exists.",
      };
    }
    Auth.login(email, role, name);
    return { success: true };
  },
  logout: () => {
    localStorage.removeItem("user");
    Swal.fire({
      icon: "success",
      title: "Logged Out",
      text: "You have been successfully logged out.",
      confirmButtonColor: "#F85559",
    }).then(() => {
      window.location.href = "account.html";
    });
  },
  updateProfile: (data) => {
    const user = Auth.getUser();
    const updated = { ...user, ...data };
    localStorage.setItem("user", JSON.stringify(updated));
    localStorage.setItem(
      `profile_${user.email}`,
      JSON.stringify({ name: updated.name, image: updated.image }),
    );
    return updated;
  },
  getUser: () => JSON.parse(localStorage.getItem("user")),
  isLoggedIn: () => !!localStorage.getItem("user"),
  accountExists: (email) => !!localStorage.getItem(`profile_${email}`),
  resetPassword: (email) => {
    // In a real app, this would send an email. For now, we mock it.
    const profileKey = `profile_${email}`;
    const profile = JSON.parse(localStorage.getItem(profileKey));
    if (!profile) {
      return { success: false, message: "No account found with this email." };
    }
    return {
      success: true,
      message: "Instructions have been sent to your email!",
    };
  },
};

// Helper to convert file to Base64
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const Cart = {
  add: (item) => {
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push(item);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
  },
  get: () => JSON.parse(localStorage.getItem("cart") || "[]"),
  clear: () => localStorage.removeItem("cart"),
};

function updateCartCount() {
  const count = Cart.get().length;
  const badge = document.getElementById("cart-count");
  if (badge) badge.innerText = count;
}

// Function to load external HTML components
async function loadComponent(elementId, filePath) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load ${filePath}: ${response.statusText}`);
    }
    const html = await response.text();
    document.getElementById(elementId).innerHTML = html;

    // After header loads, update UI based on auth state
    if (elementId === "header-placeholder") {
      updateHeaderUI();
    }
  } catch (error) {
    console.error("Error loading component:", error);
    alert(
      `System Error: Could not load page components. Please refresh the page.`,
    );
  }
}

function updateHeaderUI() {
  const user = Auth.getUser();
  const authBtn = document.getElementById("header-auth-btn");

  if (user && user.loggedIn && authBtn) {
    const roleTitle =
      user.role === "owner" ? "Owner Dashboard" : "Client Dashboard";
    authBtn.innerText = roleTitle;
    authBtn.href =
      user.role === "owner" ? "dashboard-owner.html" : "dashboard-client.html";
    authBtn.onclick = null;
  } else if (authBtn) {
    authBtn.innerText = "Login";
    authBtn.href = "account.html";
  }

  // Search Functionality (Initialize after header loads)
  const searchInput = document.querySelector("#header-search-input");
  const searchBtn = document.querySelector("#header-search-btn");

  const handleSearch = () => {
    const query = searchInput.value.trim();
    if (query) {
      if (window.location.pathname.includes("shop.html")) {
        if (typeof loadDynamicProducts === "function") {
          loadDynamicProducts(query);
        }
      } else {
        window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
      }
    }
  };

  if (searchBtn && searchInput) {
    searchBtn.onclick = handleSearch;
    searchInput.onkeypress = (e) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    };
  }
}

// Initialize components and other logic
document.addEventListener("DOMContentLoaded", async () => {
  // Load Header and Footer first
  await Promise.all([
    loadComponent("header-placeholder", "components/header.html"),
    loadComponent("footer-placeholder", "components/footer.html"),
  ]);

  const loginForm = document.querySelector("#login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = e.target.querySelector("input[type='email']").value;

      if (!Auth.accountExists(email)) {
        Swal.fire({
          icon: "error",
          title: "Account Not Found",
          text: "Please register first.",
          confirmButtonColor: "#F85559",
        });
        return;
      }

      const roleSelect = e.target.querySelector("#user-role");
      const role = roleSelect ? roleSelect.value : null;
      Auth.login(email, role);
    });
  }

  // Register Form Handler
  const registerForm = document.querySelector("#register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = e.target.querySelector("input[type='email']").value;
      if (Auth.accountExists(email)) {
        Swal.fire({
          icon: "warning",
          title: "Account Already Exists",
          text: "Please login instead.",
          confirmButtonColor: "#F85559",
        });
        return;
      }

      // Clear any previous user session first
      localStorage.removeItem("user");

      const role = e.target.querySelector("#reg-role").value;
      const name = e.target.querySelector("input[type='text']").value;

      const result = Auth.register(email, role, name);
      if (!result.success) {
        Swal.fire({
          icon: "error",
          title: "Registration Failed",
          text: result.message,
          confirmButtonColor: "#F85559",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Account Created!",
        text: `Welcome ${name}!`,
        confirmButtonColor: "#F85559",
      });
    });
  }

  // Forgot Password Handler
  const forgotForm = document.querySelector("#forgot-form");
  if (forgotForm) {
    forgotForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = e.target.querySelector("input[type='email']").value;
      const result = Auth.resetPassword(email);

      Swal.fire({
        icon: result.success ? "success" : "error",
        title: result.success ? "Email Sent" : "Error",
        text: result.message,
        confirmButtonColor: "#F85559",
      }).then(() => {
        if (result.success && typeof toggleAuth === "function") {
          toggleAuth("login");
        }
      });
    });
  }

  // Owner Add Product Handler
  const addProductForm = document.querySelector("#add-product-form");
  if (addProductForm) {
    addProductForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = e.target.querySelector("#prod-name").value;
      const category = e.target.querySelector("#prod-category").value;
      const price = e.target.querySelector("#prod-price").value;
      const imageFile = e.target.querySelector("#prod-image-file").files[0];

      let imageUrl = "images/fruit1.png";
      if (imageFile) {
        imageUrl = await fileToBase64(imageFile);
      }

      const products = JSON.parse(
        localStorage.getItem("shop_products") || "[]",
      );
      products.push({ name, category, price, image: imageUrl, id: Date.now() });
      localStorage.setItem("shop_products", JSON.stringify(products));

      Swal.fire({
        icon: "success",
        title: "Product Added",
        text: `${name} added to inventory!`,
        confirmButtonColor: "#3B82F6",
      });
      e.target.reset();
      if (typeof loadInventory === "function") loadInventory();
    });
  }

  // Add to Cart Handlers (Using event delegation)
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-add-cart")) {
      if (!Auth.isLoggedIn()) {
        window.location.href = "account.html";
        return;
      }
      const card = e.target.closest(".card");
      const name = card.querySelector("h3").innerText;
      const price = card.querySelector(
        ".card-title, .text-center.font-extrabold",
      ).innerText;
      Cart.add({ name, price });

      Swal.fire({
        icon: "success",
        title: "Added to Cart",
        text: `${name} has been added!`,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    }
  });

  // Client Profile Update Handler
  const clientProfileForm = document.querySelector("#client-profile-form");
  if (clientProfileForm) {
    clientProfileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = e.target.querySelector("#client-full-name").value;
      const imageFile = e.target.querySelector("#client-profile-img").files[0];
      let profileData = { name };

      if (imageFile) {
        profileData.image = await fileToBase64(imageFile);
      }

      Auth.updateProfile(profileData);
      Swal.fire({
        icon: "success",
        title: "Profile Updated",
        text: "Your changes have been saved!",
        confirmButtonColor: "#F85559",
      }).then(() => {
        location.reload();
      });
    });
  }

  // Owner Profile Update Handler
  const ownerProfileForm = document.querySelector("#owner-profile-form");
  if (ownerProfileForm) {
    ownerProfileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = e.target.querySelector("#owner-store-name").value;
      const imageFile = e.target.querySelector("#owner-profile-img").files[0];
      let profileData = { name };

      if (imageFile) {
        profileData.image = await fileToBase64(imageFile);
      }

      Auth.updateProfile(profileData);
      Swal.fire({
        icon: "success",
        title: "Store Settings Updated",
        text: "Your changes have been saved!",
        confirmButtonColor: "#3B82F6",
      }).then(() => {
        location.reload();
      });
    });
  }

  // Initialize Swiper Slider if element exists
  const swiperEl = document.querySelector(".mySwiper");
  if (swiperEl) {
    const swiper = new Swiper(".mySwiper", {
      // Optional parameters
      direction: "horizontal",
      loop: true,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false, // Continue autoplay after user interactions
        pauseOnMouseEnter: true, // Pause when mouse is over the slider
      },
      speed: 800, // Smooth transition speed

      // If we need pagination (dots)
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
        // Custom styling for active dots can be handled by swiper's default classes
        // swiper-pagination-bullet-active handles the active state
      },

      // Navigation arrows
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
    });
  }

  // Deal of the Day Countdown Logic
  const initCountdown = () => {
    // Storing target date in localStorage so it persists across page refreshes
    let targetDate = localStorage.getItem("dealEndDate");

    if (!targetDate) {
      // Set end date to ~29 days, 15 hrs, 25 mins, 8 secs from first visit
      const now = new Date();
      now.setDate(now.getDate() + 29);
      now.setHours(now.getHours() + 15);
      now.setMinutes(now.getMinutes() + 25);
      now.setSeconds(now.getSeconds() + 8);
      targetDate = now.getTime();
      localStorage.setItem("dealEndDate", targetDate);
    } else {
      targetDate = parseInt(targetDate, 10);
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      // Reset logic if countdown finishes
      if (distance < 0) {
        localStorage.removeItem("dealEndDate");
        return;
      }

      // Calculations
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // Update DOM (Check if elements exist on page first)
      const daysEl = document.getElementById("days");
      const hoursEl = document.getElementById("hours");
      const minutesEl = document.getElementById("minutes");
      const secondsEl = document.getElementById("seconds");

      if (daysEl) daysEl.innerText = days.toString().padStart(2, "0");
      if (hoursEl) hoursEl.innerText = hours.toString().padStart(2, "0");
      if (minutesEl) minutesEl.innerText = minutes.toString().padStart(2, "0");
      if (secondsEl) secondsEl.innerText = seconds.toString().padStart(2, "0");
    };

    // Run immediately to avoid 1-second delay
    updateTimer();
    // Update every 1 second
    setInterval(updateTimer, 1000);
  };

  // Initialize Countdown
  initCountdown();
});
