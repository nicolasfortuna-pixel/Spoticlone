import { db } from "./firebase.js";
import {
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
let musicas = {}; // copia local dos dados do banco

const lista = document.getElementById("lista");
const player = document.getElementById("player");
const playerCapa = document.getElementById("player-capa");
const playerTitulo = document.getElementById("player-titulo");
const playerArtista = document.getElementById("player-artista");

const CAPA_PADRAO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23333'/%3E%3C/svg%3E";

// Evita que texto digitado vire HTML (segurança)
const esc = (t) =>
  String(t ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c])
  );

function criarCard(id, m) {
  return `
      <div class="card" data-id="${id}">
        <img class="capa" src="${esc(m.capa)}" alt="Capa de ${esc(m.titulo)}">
        <div class="info">
          <h3>${esc(m.titulo)}</h3>
          <p>${esc(m.artista)}</p>
          <span class="tag tag-${esc(m.genero).toLowerCase()}">${esc(
    m.genero
  )}</span>
        </div>
      </div>
      `;
}

onValue(ref(db, "musicas"), (snapshot) => {
  const dados = snapshot.val();
  musicas = dados || {};
  console.log("Músicas:", musicas);

  if (!dados) {
    lista.innerHTML = "<p>Nenhuma música cadastrada.</p>";
    return;
  }

  lista.innerHTML = Object.entries(dados)
    .map(([id, musica]) => criarCard(id, musica))
    .join("");

  // Capa com link quebrado: troca pela capa padrão
  lista.querySelectorAll(".capa").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        img.src = CAPA_PADRAO;
      },
      { once: true }
    );
  });
});

lista.addEventListener("click", (e) => {
  const card = e.target.closest(".card");

  if (!card) return;

  const id = card.dataset.id;

  const musica = musicas[id];

  console.log("ID clicado:", id);
  console.log("Música escolhida:", musica);
  console.log("Áudio:", musica.audio);
  
  player.src = musica.audio;

  playerCapa.src = musica.capa;

  playerTitulo.textContent = musica.titulo;

  playerArtista.textContent = musica.artista;

  player.play();
});
