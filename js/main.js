document.addEventListener("DOMContentLoaded", function () {
  // Elementos
  const sidebarLinks = document.querySelectorAll(".nav-section ul li a");
  const contentArea = document.getElementById("content-area");
  const pageTitle = document.getElementById("page-title");
  const topicBadge = document.getElementById("topicBadge");
  const progressFill = document.getElementById("progress-fill");
  const progressText = document.getElementById("progress-text");
  const searchInput = document.getElementById("searchInput");
  const themeToggle = document.getElementById("themeToggle");
  const flashcardToggle = document.getElementById("flashcardToggle");
  const notesToggle = document.getElementById("notesToggle");
  const closeNotes = document.getElementById("closeNotes");
  const notesPanel = document.getElementById("notesPanel");
  const notesTextarea = document.getElementById("notesTextarea");
  const saveNotesBtn = document.getElementById("saveNotes");
  const completedStats = document.getElementById("completedStats");
  const streakStats = document.getElementById("streakStats");
  const navContainer = document.getElementById("navContainer");

  // Estado
  let currentPage = "";
  let flashcardMode = false;
  let isDark = true;

  // Progresso
  let progress = JSON.parse(localStorage.getItem("studyProgress") || "{}");
  let notes = JSON.parse(localStorage.getItem("studyNotes") || "{}");
  let totalTopics = sidebarLinks.length;
  let completedTopics = Object.values(progress).filter(
    (v) => v === true,
  ).length;
  let streak = JSON.parse(
    localStorage.getItem("studyStreak") || '{"days":0,"lastDate":""}',
  );

  // --- Funções ---
  function updateProgress() {
    completedTopics = Object.values(progress).filter((v) => v === true).length;
    const pct = Math.round((completedTopics / totalTopics) * 100);
    progressFill.style.width = pct + "%";
    progressText.textContent = pct + "%";
    if (completedStats) completedStats.textContent = completedTopics;
    localStorage.setItem("studyProgress", JSON.stringify(progress));
    updateStreak();
  }

  function updateStreak() {
    const today = new Date().toDateString();
    if (streak.lastDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (streak.lastDate === yesterday.toDateString()) {
      streak.days++;
    } else {
      streak.days = 1;
    }
    streak.lastDate = today;
    localStorage.setItem("studyStreak", JSON.stringify(streak));
    if (streakStats) streakStats.textContent = streak.days;
  }

  function markTopicCompleted(page) {
    if (!progress[page]) {
      progress[page] = true;
      updateProgress();
    }
  }

  function getTopicCategory(page) {
    if (page.startsWith("dev/")) return "Desenvolvimento";
    if (page.startsWith("ingles/")) return "Inglês";
    return "Geral";
  }

  function loadPage(page) {
    currentPage = page;
    const category = getTopicCategory(page);
    topicBadge.textContent = category;

    // Carregar anotações salvas
    if (notes[page]) {
      notesTextarea.value = notes[page];
    } else {
      notesTextarea.value = "";
    }

    fetch("pages/" + page)
      .then((response) => {
        if (!response.ok) throw new Error("Page not found");
        return response.text();
      })
      .then((html) => {
        contentArea.innerHTML = html;

        const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
        if (titleMatch) {
          pageTitle.textContent = titleMatch[1];
        } else {
          pageTitle.textContent = page.replace(".html", "").replace(/-/g, " ");
        }

        // Marcar link ativo
        sidebarLinks.forEach((link) => link.classList.remove("active"));
        document
          .querySelector(`a[data-page="${page}"]`)
          ?.classList.add("active");

        if (!progress[page]) {
          markTopicCompleted(page);
        }

        setupExercises();

        if (flashcardMode) {
          contentArea.classList.add("flashcard-mode");
        }
      })
      .catch(() => {
        contentArea.innerHTML = `
                    <div class="topic-content">
                        <h1>⚠️ Erro ao carregar</h1>
                        <p>Não foi possível carregar o conteúdo. Tente novamente.</p>
                    </div>
                `;
      });
  }

  function setupExercises() {
    document.querySelectorAll(".resposta-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const exercicio = this.closest(".exercicio");
        const resposta = exercicio.querySelector(".resposta");
        const isCorrect = this.dataset.correct === "true";

        resposta.classList.add("show");
        resposta.classList.remove("correct", "wrong");
        resposta.classList.add(isCorrect ? "correct" : "wrong");
        this.textContent = isCorrect ? "✅ Correta!" : "❌ Incorreta";
        this.disabled = true;
      });
    });
  }

  function filterTopics(query) {
    const q = query.toLowerCase().trim();
    sidebarLinks.forEach((link) => {
      const text = link.textContent.toLowerCase();
      if (q === "" || text.includes(q)) {
        link.classList.remove("hidden");
      } else {
        link.classList.add("hidden");
      }
    });
  }

  function toggleTheme() {
    isDark = !isDark;
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light",
    );
    themeToggle.innerHTML = isDark
      ? '<i class="fas fa-moon"></i>'
      : '<i class="fas fa-sun"></i>';
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  function toggleFlashcardMode() {
    flashcardMode = !flashcardMode;
    contentArea.classList.toggle("flashcard-mode", flashcardMode);
    flashcardToggle.style.borderColor = flashcardMode
      ? "var(--primary)"
      : "var(--border)";
    flashcardToggle.style.background = flashcardMode
      ? "var(--bg-hover)"
      : "var(--bg-dark)";
  }

  function toggleNotes() {
    notesPanel.classList.toggle("open");
  }

  function saveNotes() {
    if (currentPage) {
      notes[currentPage] = notesTextarea.value;
      localStorage.setItem("studyNotes", JSON.stringify(notes));
      const btn = saveNotesBtn;
      btn.textContent = "✅ Salvo!";
      setTimeout(() => {
        btn.textContent = "Salvar Anotações";
      }, 1500);
    }
  }

  // --- Event Listeners ---

  // Navegação
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const page = this.dataset.page;
      if (page) {
        loadPage(page);
        // Fechar sidebar mobile
        document.querySelector(".sidebar")?.classList.remove("open");
      }
    });
  });

  // Busca
  searchInput.addEventListener("input", function () {
    filterTopics(this.value);
  });

  // Tema
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    isDark = savedTheme === "dark";
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light",
    );
    themeToggle.innerHTML = isDark
      ? '<i class="fas fa-moon"></i>'
      : '<i class="fas fa-sun"></i>';
  }
  themeToggle.addEventListener("click", toggleTheme);

  // Flashcard
  flashcardToggle.addEventListener("click", toggleFlashcardMode);

  // Notas
  notesToggle.addEventListener("click", toggleNotes);
  closeNotes.addEventListener("click", toggleNotes);
  saveNotesBtn.addEventListener("click", saveNotes);

  // Fechar notas com Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && notesPanel.classList.contains("open")) {
      toggleNotes();
    }
  });

  // Carregar página inicial
  const savedPage = localStorage.getItem("lastPage");
  if (savedPage && document.querySelector(`a[data-page="${savedPage}"]`)) {
    loadPage(savedPage);
  } else {
    // Welcome
    const stats = document.getElementById("completedStats");
    const streakEl = document.getElementById("streakStats");
    if (stats) stats.textContent = completedTopics;
    if (streakEl) streakEl.textContent = streak.days || 0;
  }

  updateProgress();

  // Salvar última página
  window.addEventListener("beforeunload", function () {
    const activeLink = document.querySelector(".nav-section ul li a.active");
    if (activeLink) {
      localStorage.setItem("lastPage", activeLink.dataset.page);
    }
  });

  // Responsive - menu toggle para mobile
  const sidebar = document.querySelector(".sidebar");
  if (window.innerWidth <= 768) {
    document.addEventListener("click", function (e) {
      if (
        sidebar &&
        !sidebar.contains(e.target) &&
        !e.target.closest(".nav-section ul li a")
      ) {
        sidebar.classList.remove("open");
      }
    });
  }
});

// --- Menu Mobile ---
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');

if (menuToggle) {
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
    });
}

// Fechar sidebar ao clicar fora
document.addEventListener('click', function(e) {
    if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && !e.target.closest('.menu-toggle')) {
            sidebar.classList.remove('open');
        }
    }
});

// --- Reset Progress ---
const resetBtn = document.getElementById('resetProgressBtn');
if (resetBtn) {
    resetBtn.addEventListener('click', function() {
        if (confirm('Tem certeza que deseja resetar todo o progresso?')) {
            localStorage.removeItem('studyProgress');
            localStorage.removeItem('studyStreak');
            progress = {};
            streak = { days: 0, lastDate: '' };
            updateProgress();
            if (completedStats) completedStats.textContent = '0';
            if (streakStats) streakStats.textContent = '0';
            // Recarregar página atual
            const activeLink = document.querySelector('.nav-section ul li a.active');
            if (activeLink) {
                loadPage(activeLink.dataset.page);
            }
        }
    });
}

// --- Toggle Sidebar ---
const toggleSidebarBtn = document.getElementById('toggleSidebar');
let sidebarVisible = true;

if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', function() {
        sidebarVisible = !sidebarVisible;
        if (window.innerWidth > 768) {
            sidebar.style.display = sidebarVisible ? 'flex' : 'none';
            this.innerHTML = sidebarVisible ? '<i class="fas fa-chevron-left"></i>' : '<i class="fas fa-chevron-right"></i>';
        }
    });
}

// --- Notes Status ---
const notesStatus = document.getElementById('notesStatus');

// Sobrescrever saveNotes com feedback
const originalSaveNotes = saveNotes;
saveNotes = function() {
    if (currentPage) {
        notes[currentPage] = notesTextarea.value;
        localStorage.setItem('studyNotes', JSON.stringify(notes));
        if (notesStatus) {
            notesStatus.textContent = '✅ Salvo!';
            notesStatus.className = 'notes-status saved';
            setTimeout(() => {
                notesStatus.textContent = '';
                notesStatus.className = 'notes-status';
            }, 2000);
        }
    }
};

// Atualizar o event listener do saveNotes
if (saveNotesBtn) {
    saveNotesBtn.removeEventListener('click', originalSaveNotes);
    saveNotesBtn.addEventListener('click', saveNotes);
}

// --- Mini Progress ---
function updateMiniProgress() {
    const miniProgress = document.getElementById('miniProgress');
    const miniStreak = document.getElementById('miniStreak');
    if (miniProgress) {
        const pct = Math.round((completedTopics / totalTopics) * 100);
        miniProgress.textContent = pct + '%';
    }
    if (miniStreak) {
        miniStreak.textContent = '🔥 ' + (streak.days || 0);
    }
}

// Sobrescrever updateProgress para incluir mini
const originalUpdateProgress = updateProgress;
updateProgress = function() {
    originalUpdateProgress();
    updateMiniProgress();
};

// Inicializar mini
updateMiniProgress();

// --- Keyboard Shortcuts ---
document.addEventListener('keydown', function(e) {
    // Ctrl + N = abrir notas
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        toggleNotes();
    }
    // Escape = fechar notas
    if (e.key === 'Escape') {
        if (notesPanel && notesPanel.classList.contains('open')) {
            toggleNotes();
        }
    }
    // Ctrl + F = focar busca
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        if (searchInput) {
            searchInput.focus();
        }
    }
});

console.log('🚀 Do Zero à Maestria');
console.log('📚 45 tópicos · 1.125 exercícios');
console.log('💡 Dica: Ctrl+N para abrir anotações, Ctrl+F para buscar');