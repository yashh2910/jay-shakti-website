// ============================================================
// ADMIN PANEL — shared behaviours
// Currently: auto-dismiss for success alert messages.
// Works on every admin page automatically (included once via
// the shared admin-nav partial) — no per-page wiring needed.
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const AUTO_DISMISS_DELAY = 5000; // ms
  const FADE_DURATION = 500; // ms — keep in sync with the CSS transition

  // Each success alert gets its own independent timer, so multiple
  // alerts on the same page fade out on their own schedule.
  document.querySelectorAll('.admin-alert-success').forEach((alertEl) => {
    setTimeout(() => {
      alertEl.classList.add('admin-alert-fade-out');
      alertEl.addEventListener(
        'transitionend',
        () => alertEl.remove(),
        { once: true }
      );
      // Fallback in case transitionend doesn't fire (e.g. element already hidden)
      setTimeout(() => alertEl.remove(), FADE_DURATION + 100);
    }, AUTO_DISMISS_DELAY);
  });

  // ---- Mobile sidebar toggle ----
  const sidebar = document.getElementById('adminSidebar');
  const toggleBtn = document.getElementById('adminSidebarToggle');
  const backdrop = document.getElementById('adminSidebarBackdrop');

  if (sidebar && toggleBtn && backdrop) {
    const openSidebar = () => {
      sidebar.classList.add('open');
      backdrop.classList.add('open');
      toggleBtn.setAttribute('aria-expanded', 'true');
    };
    const closeSidebar = () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    };

    toggleBtn.addEventListener('click', () => {
      sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
    backdrop.addEventListener('click', closeSidebar);
    // Close automatically after tapping a nav link (mobile UX)
    sidebar.querySelectorAll('.admin-nav-link').forEach((link) => {
      link.addEventListener('click', closeSidebar);
    });
  }
});
