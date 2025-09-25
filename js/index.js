document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".category_list_container a.button.tile").forEach((a) => {
    const category = (a.dataset.category || a.textContent).trim();
    a.href = "productlist.html?category=" + encodeURIComponent(category);
  });
});