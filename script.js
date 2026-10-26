(() => {
  const config = window.WFI_CONFIG || {};
  const clientReady = config.SUPABASE_URL && config.SUPABASE_ANON_KEY &&
    !config.SUPABASE_URL.includes("YOUR-PROJECT") &&
    !config.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");
  const grid = document.getElementById("productGrid");
  const status = document.getElementById("statusMessage");
  const empty = document.getElementById("emptyState");
  const search = document.getElementById("searchInput");
  const chips = [...document.querySelectorAll(".category-chip")];
  let products = [];
  let activeCategory = "All";

  document.getElementById("currentYear").textContent = new Date().getFullYear();
  document.getElementById("menuToggle").addEventListener("click", () => {
    const nav = document.getElementById("navigation");
    const open = nav.classList.toggle("open");
    document.getElementById("menuToggle").setAttribute("aria-expanded", String(open));
  });
  chips.forEach(chip => chip.addEventListener("click", () => {
    activeCategory = chip.dataset.category;
    chips.forEach(item => item.classList.toggle("active", item === chip));
    render();
  }));
  search.addEventListener("input", render);

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }
  function safeUrl(value) {
    try { const u = new URL(value); return ["http:","https:"].includes(u.protocol) ? u.href : ""; }
    catch { return ""; }
  }
  function render() {
    const q = search.value.trim().toLowerCase();
    const shown = products.filter(p => {
      const matchCategory = activeCategory === "All" || p.category === activeCategory;
      const haystack = `${p.title || ""} ${p.description || ""} ${p.keywords || ""} ${p.category || ""}`.toLowerCase();
      return matchCategory && haystack.includes(q);
    });
    grid.innerHTML = shown.map(p => {
      const image = safeUrl(p.image_url);
      const amazon = safeUrl(p.amazon_url);
      return `<article class="product-card">
        ${image ? `<img class="product-image" src="${escapeHTML(image)}" alt="${escapeHTML(p.title)}" loading="lazy" referrerpolicy="no-referrer">` : `<div class="product-image-placeholder">${escapeHTML(p.title)}</div>`}
        <div class="product-card-content">
          ${p.featured ? '<span class="featured-label">FEATURED FIND</span>' : ''}
          <span class="product-category">${escapeHTML(p.category || "Other")}</span>
          <h3>${escapeHTML(p.title)}</h3>
          <p>${escapeHTML(p.description)}</p>
          <div class="product-actions">${amazon ? `<a class="amazon-link" href="${escapeHTML(amazon)}" target="_blank" rel="sponsored nofollow noopener">View on Amazon ↗</a>` : '<span class="status-message">Product link coming soon</span>'}</div>
        </div>
      </article>`;
    }).join("");
    status.hidden = shown.length > 0;
    status.textContent = products.length ? "" : "Product finds will appear here soon.";
    empty.hidden = shown.length !== 0 || products.length === 0;
  }

  async function init() {
    if (!clientReady || !window.supabase) {
      products = [];
      status.hidden = false;
      status.textContent = "The product database has not been connected yet. Follow the setup guide to add your Supabase project settings.";
      render();
      return;
    }
    try {
      const client = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
      const { data, error } = await client.from("products")
        .select("id,title,description,category,image_url,amazon_url,keywords,featured,created_at")
        .eq("published", true).order("featured", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      products = data || [];
      render();
    } catch (error) {
      status.hidden = false;
      status.textContent = "We couldn't load the product finds right now. Please try again later.";
      console.error("Product load failed:", error.message);
    }
  }
  init();
})();
