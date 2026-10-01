  import { db } from "./firebase.js";
  import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
  const modal = document.getElementById("modal");
  const form = document.getElementById("form-musica");
  let musicas = {};        // copia local dos dados do banco
  let idEditando = null;   // null = adicionando | id = editando

  document.getElementById("btn-abrir").addEventListener("click", () => {
    modal.showModal();
  });

  document.getElementById("btn-cancelar").addEventListener("click", () => {
    modal.close();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const musica = {
      titulo: document.getElementById("titulo").value.trim(),
      artista: document.getElementById("artista").value.trim(),
      genero: document.getElementById("genero").value,
      capa: document.getElementById("capa").value.trim(),
      audio: document.getElementById("audio").value.trim()
    };

    try {
      if (idEditando) {
    await update(ref(db, `musicas/${idEditando}`), musica);
  } else {
    await push(ref(db, "musicas"), musica);
  }
      form.reset();
      modal.close();
    } catch (erro) {
      console.error("Erro ao salvar:", erro);
      alert("Não foi possível salvar a música.");
    }
  });
  const lista = document.getElementById("lista");

  const CAPA_PADRAO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23333'/%3E%3C/svg%3E";

  // Evita que texto digitado vire HTML (segurança)
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  function criarCard(id, m) {
    return `
      <div class="card">
        <img class="capa" src="${esc(m.capa)}" alt="Capa de ${esc(m.titulo)}">
        <div class="info">
          <h3>${esc(m.titulo)}</h3>
          <p>${esc(m.artista)}</p>
          <span class="tag tag-${esc(m.genero).toLowerCase()}">${esc(m.genero)}</span>
        </div>
        <div class="acoes">
          <span>Ações</span>
          <button class="btn-editar" data-id="${id}"><i class="bi bi-pencil"></i></button>
          <button class="btn-excluir" data-id="${id}"><i class="bi bi-trash"></i></button>
        </div>
      </div>`;
  }

  onValue(ref(db, "musicas"), (snapshot) => {
    const dados = snapshot.val();
    musicas = dados || {};

    if (!dados) {
      lista.innerHTML = "<p>Nenhuma música cadastrada.</p>";
      return;
    }

    lista.innerHTML = Object.entries(dados)
      .map(([id, musica]) => criarCard(id, musica))
      .join("");

    // Capa com link quebrado: troca pela capa padrão
    lista.querySelectorAll(".capa").forEach((img) => {
      img.addEventListener("error", () => { img.src = CAPA_PADRAO; }, { once: true });
    });
  });

  // Quando o modal fecha (Salvar, Cancelar ou Esc), volta ao estado "adicionar"
  modal.addEventListener("close", () => {
    idEditando = null;
    form.reset();
    document.getElementById("modal-titulo").textContent = "Adicionar música";
  });

  // Um único listener para todos os botões da lista
  lista.addEventListener("click", async (e) => {
    const botao = e.target.closest("button");
    if (!botao) return;
    const id = botao.dataset.id;

    if (botao.classList.contains("btn-excluir")) {
      if (!confirm("Excluir esta música?")) return;
      try {
        await remove(ref(db, `musicas/${id}`));
      } catch (erro) {
        console.error("Erro ao excluir:", erro);
        alert("Não foi possível excluir.");
      }
    }

    if (botao.classList.contains("btn-editar")) {
      const m = musicas[id];
      idEditando = id;
      document.getElementById("titulo").value = m.titulo;
      document.getElementById("artista").value = m.artista;
      document.getElementById("genero").value = m.genero;
      document.getElementById("capa").value = m.capa;
      document.getElementById("audio").value = m.audio;
      document.getElementById("modal-titulo").textContent = "Editar música";
      modal.showModal();
    }
  }); 