
document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const navigation = document.getElementById("navigation");
  const searchToggle = document.getElementById("searchToggle");
  const searchPanel = document.getElementById("searchPanel");
  const searchInput = document.getElementById("searchInput");
  const articleGrid = document.getElementById("articleGrid");
  const articleCards = [...document.querySelectorAll(".article-card")];
  const categoryButtons = document.querySelectorAll("[data-category]");
  const navLinks = document.querySelectorAll(".nav-link");
  const heading = document.getElementById("articleHeading");
  const resultMessage = document.getElementById("resultMessage");
  const emptyMessage = document.getElementById("emptyMessage");
  const showAll = document.getElementById("showAll");

  let selectedCategory = "";
  let searchTerm = "";

  // Mobile navigation
  menuToggle.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.textContent = isOpen ? "×" : "☰";
  });

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      navigation.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.textContent = "☰";
    });
  });

  // Search panel
  searchToggle.addEventListener("click", () => {
    searchPanel.hidden = !searchPanel.hidden;

    if (!searchPanel.hidden) {
      searchInput.focus();
    } else {
      searchInput.value = "";
      searchTerm = "";
      updateArticles();
    }
  });

  // Filter and search articles
  function updateArticles() {
    let visibleCount = 0;

    articleCards.forEach(card => {
      const category = card.dataset.category;
      const text = card.textContent.toLowerCase();
      const matchesCategory =
        !selectedCategory || category === selectedCategory;
      const matchesSearch = text.includes(searchTerm);

      const visible = matchesCategory && matchesSearch;
      card.hidden = !visible;

      if (visible) visibleCount++;
    });

    if (selectedCategory) {
      heading.textContent = selectedCategory;
    } else {
      heading.textContent = searchTerm
        ? "Search Results"
        : "Featured Articles";
    }

    resultMessage.textContent =
      searchTerm || selectedCategory
        ? `${visibleCount} article${visibleCount === 1 ? "" : "s"} found`
        : "";

    emptyMessage.hidden = visibleCount !== 0;
    articleGrid.hidden = visibleCount === 0;
  }

  searchInput.addEventListener("input", event => {
    searchTerm = event.target.value.trim().toLowerCase();
    updateArticles();
  });

  categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
      selectedCategory = button.dataset.category;
      searchTerm = "";
      searchInput.value = "";

      updateArticles();

      document.getElementById("articles").scrollIntoView({
        behavior: "smooth"
      });
    });
  });

  showAll.addEventListener("click", () => {
    selectedCategory = "";
    searchTerm = "";
    searchInput.value = "";
    updateArticles();
  });

  // Highlight selected navigation category
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      navLinks.forEach(item => item.classList.remove("active"));
      link.classList.add("active");

      if (link.dataset.category) {
        selectedCategory = link.dataset.category;
        searchTerm = "";
        searchInput.value = "";
        updateArticles();
      } else if (link.getAttribute("href") === "#home") {
        selectedCategory = "";
        searchTerm = "";
        searchInput.value = "";
        updateArticles();
      }
    });
  });

  // Automatically update copyright year
  document.getElementById("currentYear").textContent =
    new Date().getFullYear();

  updateArticles();
});
