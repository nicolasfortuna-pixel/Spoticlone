import { db } from "./firebase.js";

import {
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

let musicas = {};
let idAtual = null;

// Elementos HTML
const lista = document.getElementById("lista");
const player = document.getElementById("player");

const modal = document.getElementById("player-modal");

const capa = document.getElementById("player-capa");
const titulo = document.getElementById("player-titulo");
const artista = document.getElementById("player-artista");

const btnPlay = document.getElementById("btn-play");
const btnAnterior = document.getElementById("btn-anterior");
const btnProxima = document.getElementById("btn-proxima");
const btnFechar = document.getElementById("btn-fechar-player");

// Capa padrão
const CAPA_PADRAO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23333'/%3E%3C/svg%3E";

// Evita que texto vire HTML
const esc = (texto) =>
  String(texto ?? "").replace(
    /[&<>"']/g,
    (caractere) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[caractere],
  );

// Cria os cards das músicas
function criarCard(id, musica) {
  return `
        <div class="card ${id === idAtual ? "ativo" : ""}" data-id="${esc(id)}">

            <img
                class="capa"
                src="${esc(musica.capa)}"
                alt="Capa de ${esc(musica.titulo)}"
            >

            <div class="info">

                <h3>${esc(musica.titulo)}</h3>

                <p>${esc(musica.artista)}</p>

                <span class="tag tag-${esc(musica.genero).toLowerCase()}">
                    ${esc(musica.genero)}
                </span>

            </div>

        </div>
    `;
}

// Carrega uma música
function carregar(id) {
  const musica = musicas[id];

  if (!musica) return;

  idAtual = id;

  // Caminho do áudio
  let urlAudio = musica.audio;

  if (!urlAudio.startsWith("http")) {
    urlAudio = `./${urlAudio}`;
  }

  console.log("Tocando:", musica.titulo);
  console.log("Áudio:", urlAudio);

  // Coloca a música no player
  player.src = urlAudio;

  // Atualiza informações
  capa.src = musica.capa;
  titulo.textContent = musica.titulo;
  artista.textContent = musica.artista;

  // Marca o card atual
  lista.querySelectorAll(".card").forEach((card) => {
    card.classList.toggle("ativo", card.dataset.id === id);
  });

  // Toca
  tocar();
}

// Toca a música
async function tocar() {
  try {
    await player.play();
  } catch (erro) {
    console.error("Erro ao tocar:", erro);
  }
}

// Play / Pause
function alternar() {
  if (player.paused) {
    player.play();
  } else {
    player.pause();
  }
}

// Próxima ou anterior
function trocar(passo) {
  const ids = Object.keys(musicas);

  if (ids.length === 0) return;

  const indice = ids.indexOf(idAtual);

  const novoIndice = (indice + passo + ids.length) % ids.length;

  carregar(ids[novoIndice]);
}

// Abre o player
function abrirPlayer() {
  if (!modal.open) {
    modal.showModal();
  }
}

// CARREGAR MÚSICAS DO FIREBASE

onValue(
  ref(db, "musicas"),

  (snapshot) => {
    const dados = snapshot.val();

    musicas = dados || {};

    if (!dados) {
      lista.innerHTML = "<p>Nenhuma música cadastrada.</p>";

      return;
    }

    lista.innerHTML = Object.entries(dados)

      .map(([id, musica]) => criarCard(id, musica))

      .join("");

    // Capa quebrada
    lista.querySelectorAll(".capa").forEach((img) => {
      img.addEventListener(
        "error",
        () => {
          img.src = CAPA_PADRAO;
        },
        { once: true },
      );
    });
  },

  (erro) => {
    console.error("Erro ao ler o banco:", erro);

    lista.innerHTML = "<p>Não foi possível carregar as músicas.</p>";
  },
);

// EVENTOS

// Clicar em uma música
lista.addEventListener("click", (evento) => {
  const card = evento.target.closest(".card");

  if (!card) return;

  const id = card.dataset.id;

  if (id !== idAtual) {
    carregar(id);
  }

  abrirPlayer();
});

// Play / Pause
btnPlay.addEventListener("click", alternar);

// Música anterior
btnAnterior.addEventListener("click", () => {
  trocar(-1);
});

// Próxima música
btnProxima.addEventListener("click", () => {
  trocar(1);
});

// Fechar player
btnFechar.addEventListener("click", () => {
  modal.close();
});

// Quando a música terminar,
// toca automaticamente a próxima
player.addEventListener("ended", () => {
  trocar(1);
});

// Atualiza o botão Play/Pause
player.addEventListener("play", () => {
  btnPlay.innerHTML = '<i class="bi bi-pause-fill"></i>';
});

player.addEventListener("pause", () => {
  btnPlay.innerHTML = '<i class="bi bi-play-fill"></i>';
});

// Erro no áudio
player.addEventListener("error", () => {
  console.error("Erro no áudio:", player.error);

  titulo.textContent = "Não foi possível tocar esta música";
});

// Capa quebrada
capa.addEventListener("error", () => {
  capa.src = CAPA_PADRAO;
});
