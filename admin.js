
(() => {
  const cfg = window.WFI_CONFIG || {};

  const ready =
    cfg.SUPABASE_URL &&
    cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes("YOUR-PROJECT") &&
    !cfg.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE") &&
    window.supabase;

  const $ = (id) => document.getElementById(id);
  const loginPanel = $("loginPanel");
  const dashboard = $("dashboard");
  const setupWarning = $("setupWarning");

  let db = null;
  let products = [];

  function message(el, text, error = false) {
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("error", Boolean(error));
  }

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character]));
  }

  function safeUrl(value) {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  // Validate the Amazon product or affiliate link.
  function isAmazonProductUrl(value) {
    try {
      const url = new URL(value);
      const hostname = url.hostname.toLowerCase();

      return (
        url.protocol === "https:" &&
        (
          hostname === "amazon.com" ||
          hostname.endsWith(".amazon.com")
        )
      );
    } catch {
      return false;
    }
  }

  // Image URLs are checked separately from Amazon product links.
  function isHttpsUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:";
    } catch {
      return false;
    }
  }

  function showSignedIn(signedIn) {
    loginPanel.hidden = signedIn;
    dashboard.hidden = !signedIn;
  }

  function clearForm() {
    $("productForm").reset();
    $("productId").value = "";
    $("formHeading").textContent = "Add a product";
    $("published").checked = true;
    message($("formMessage"), "");
    $("title").focus();
  }

  function fillForm(product) {
    $("productId").value = product.id;
    $("title").value = product.title || "";
    $("category").value = product.category || "Other";
    $("description").value = product.description || "";
    $("imageUrl").value = product.image_url || "";
    $("amazonUrl").value = product.amazon_url || "";
    $("keywords").value = product.keywords || "";
    $("featured").checked = Boolean(product.featured);
    $("published").checked = Boolean(product.published);
    $("formHeading").textContent = "Edit product";
    message($("formMessage"), "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderList() {
    const query = $("adminSearch").value.trim().toLowerCase();

    const filtered = products.filter((product) =>
      `${product.title} ${product.description} ${product.category} ${product.keywords}`
        .toLowerCase()
        .includes(query)
    );

    $("productCount").textContent =
      `${products.length} product${products.length === 1 ? "" : "s"}`;

    $("adminProductList").innerHTML = filtered.map((product) => {
      const image = safeUrl(product.image_url);

      return `
        <article class="admin-product-row">
          ${
            image
              ? `<img src="${escapeHTML(image)}" alt="" loading="lazy">`
              : `<div class="admin-product-placeholder">No image</div>`
          }
          <div class="admin-product-info">
            <strong>${escapeHTML(product.title)}</strong>
            <div class="admin-product-meta">
              ${escapeHTML(product.category)} ·
              ${product.published ? "Published" : "Draft"}
              ${product.featured ? " · Featured" : ""}
            </div>
            <div class="admin-actions">
              <button type="button" data-edit="${escapeHTML(product.id)}">Edit</button>
              <button type="button" data-toggle="${escapeHTML(product.id)}">
                ${product.published ? "Unpublish" : "Publish"}
              </button>
              <button type="button" class="delete-button"
                data-delete="${escapeHTML(product.id)}">Delete</button>
            </div>
          </div>
        </article>
      `;
    }).join("");

    if (!filtered.length) {
      $("adminProductList").innerHTML = `
        <p class="muted">
          ${
            products.length
              ? "No products match your search."
              : "No products yet. Add your first product using the form."
          }
        </p>
      `;
    }
  }

  async function loadProducts() {
    message($("listMessage"), "Loading products…");

    const { data, error } = await db
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      message(
        $("listMessage"),
        `Could not load products: ${error.message}`,
        true
      );
      return;
    }

    products = data || [];
    message($("listMessage"), "");
    renderList();
  }

  if (!ready) {
    if (setupWarning) setupWarning.hidden = false;
    showSignedIn(false);

    message(
      $("loginMessage"),
      "Database configuration is missing.",
      true
    );

    $("loginForm").addEventListener("submit", (event) => {
      event.preventDefault();
    });

    return;
  }

  db = window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  $("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    message($("loginMessage"), "Signing in…");

    const { error } = await db.auth.signInWithPassword({
      email: $("email").value.trim(),
      password: $("password").value
    });

    if (error) {
      message(
        $("loginMessage"),
        "Sign-in failed. Check your credentials and Supabase Auth setup.",
        true
      );
      return;
    }

    message($("loginMessage"), "");
  });

  $("signOut").addEventListener("click", async () => {
    const { error } = await db.auth.signOut();

    if (error) {
      message(
        $("listMessage"),
        `Sign-out failed: ${error.message}`,
        true
      );
      return;
    }

    showSignedIn(false);
  });

  $("resetForm").addEventListener("click", clearForm);
  $("adminSearch").addEventListener("input", renderList);

  $("productForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    message($("formMessage"), "Saving…");

    const payload = {
      title: $("title").value.trim(),
      category: $("category").value,
      description: $("description").value.trim(),
      image_url: $("imageUrl").value.trim() || null,
      amazon_url: $("amazonUrl").value.trim(),
      keywords: $("keywords").value.trim(),
      featured: $("featured").checked,
      published: $("published").checked,
      updated_at: new Date().toISOString()
    };

    // Check the Amazon product URL, not the image URL.
    if (!isAmazonProductUrl(payload.amazon_url)) {
      message(
        $("formMessage"),
        "Please enter a valid HTTPS Amazon.com product or affiliate link in the Amazon Product URL field.",
        true
      );
      return;
    }

    // Accept HTTPS Amazon image URLs, including m.media-amazon.com.
    if (payload.image_url && !isHttpsUrl(payload.image_url)) {
      message(
        $("formMessage"),
        "Please enter a valid HTTPS image URL in the Image URL field.",
        true
      );
      return;
    }

    const productId = $("productId").value;

    const result = productId
      ? await db
          .from("products")
          .update(payload)
          .eq("id", productId)
          .select()
          .single()
      : await db
          .from("products")
          .insert(payload)
          .select()
          .single();

    if (result.error) {
      message(
        $("formMessage"),
        `Save failed: ${result.error.message}`,
        true
      );
      return;
    }

    await loadProducts();
    clearForm();
    message($("formMessage"), "Product saved.");
  });

  $("adminProductList").addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const editId = button.dataset.edit;
    const toggleId = button.dataset.toggle;
    const deleteId = button.dataset.delete;

    if (editId) {
      const product = products.find((item) => item.id === editId);
      if (product) fillForm(product);
      return;
    }

    if (toggleId) {
      const product = products.find((item) => item.id === toggleId);
      if (!product) return;

      const { error } = await db
        .from("products")
        .update({
          published: !product.published,
          updated_at: new Date().toISOString()
        })
        .eq("id", product.id);

      if (error) {
        message(
          $("listMessage"),
          `Update failed: ${error.message}`,
          true
        );
      } else {
        message($("listMessage"), "Publish status updated.");
        await loadProducts();
      }

      return;
    }

    if (deleteId) {
      const product = products.find((item) => item.id === deleteId);

      if (
        !product ||
        !window.confirm(
          `Delete "${product.title}"? This cannot be undone.`
        )
      ) {
        return;
      }

      const { error } = await db
        .from("products")
        .delete()
        .eq("id", product.id);

      if (error) {
        message(
          $("listMessage"),
          `Delete failed: ${error.message}`,
          true
        );
      } else {
        message($("listMessage"), "Product deleted.");
        await loadProducts();

        if ($("productId").value === product.id) {
          clearForm();
        }
      }
    }
  });

  db.auth.onAuthStateChange((_event, session) => {
    const signedIn = Boolean(session);
    showSignedIn(signedIn);

    if (signedIn) {
      loadProducts();
    } else {
      products = [];
      $("adminProductList").innerHTML = "";
    }
  });

  db.auth.getSession().then(({ data, error }) => {
    if (error) {
      message(
        $("loginMessage"),
        `Could not check session: ${error.message}`,
        true
      );
      return;
    }

    const signedIn = Boolean(data.session);
    showSignedIn(signedIn);

    if (signedIn) {
      loadProducts();
    }
  });
})();
