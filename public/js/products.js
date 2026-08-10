// Live client-side filter as a nice-to-have on top of server-side search/filter.
// Since the products page is server-rendered per request (query params), this
// script simply auto-submits the search form after a short typing pause so the
// experience feels instant without needing a full JS framework.

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('productSearchInput');
  const searchForm = document.getElementById('productSearchForm');
  if (!searchInput || !searchForm) return;

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => searchForm.requestSubmit(), 500);
  });
});
