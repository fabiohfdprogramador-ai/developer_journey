document.addEventListener("DOMContentLoaded", () => {
  // Carrega o Dashboard por padrão
  loadPage("pages/dashboard.html");

  // Configura a navegação na Sidebar
  const links = document.querySelectorAll(".nav-link");
  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const page = link.getAttribute("data-page");
      if (page) {
        links.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        loadPage(page);
      }
    });
  });
});

function loadPage(pageUrl) {
  const contentArea = document.getElementById("content-area");
  fetch(pageUrl)
    .then((response) => {
      if (!response.ok) throw new Error("Página não encontrada");
      return response.text();
    })
    .then((html) => {
      contentArea.innerHTML = html;
    })
    .catch((err) => {
      contentArea.innerHTML = `<div class="card"><h2>Erro</h2><p>Não foi possível carregar a página solicitada.</p></div>`;
    });
}
