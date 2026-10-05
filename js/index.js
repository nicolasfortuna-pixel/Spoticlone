import { db } from "./firebase.js";
import {
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
let musicas = {}; // copia local dos dados do banco
let idAtual = null; // música carregada no player

const lista = document.getElementById("lista");
const player = document.getElementById("player");
const modal = document.getElementById("player-modal");
const disco = document.getElementById("disco");
const anel = document.getElementById("anel-progresso");
const capa = document.getElementById("player-capa");
const titulo = document.getElementById("player-titulo");
const artista = document.getElementById("player-artista");
const tempo = document.getElementById("player-tempo");
const btnPlay = document.getElementById("btn-play");
const btnAnterior = document.getElementById("btn-anterior");
const btnProxima = document.getElementById("btn-proxima");
const btnFechar = document.getElementById("btn-fechar-player");
const mini = document.getElementById("mini-player");
const miniCapa = document.getElementById("mini-capa");

const CAPA_PADRAO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23333'/%3E%3C/svg%3E";

const ICONE_PLAY = '<i class="bi bi-play-fill"></i>';
const ICONE_PAUSE = '<i class="bi bi-pause-fill"></i>';

// Comprimento do anel de progresso (2 * π * raio, com raio = 94 no SVG)
const CIRCUNFERENCIA = 2 * Math.PI * 94;
anel.style.strokeDasharray = CIRCUNFERENCIA;
anel.style.strokeDashoffset = CIRCUNFERENCIA;

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
      <div class="card${id === idAtual ? " ativo" : ""}" data-id="${esc(id)}">
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

/* ---------- Funções do player ---------- */

function formatarTempo(segundos) {
  if (!isFinite(segundos)) return "0:00";
  const min = Math.floor(segundos / 60);
  const seg = String(Math.floor(segundos % 60)).padStart(2, "0");
  return `${min}:${seg}`;
}

function atualizarProgresso() {
  const duracao = player.duration;
  const pct = duracao ? player.currentTime / duracao : 0;
  anel.style.strokeDashoffset = CIRCUNFERENCIA * (1 - pct);
  tempo.textContent = `${formatarTempo(player.currentTime)} / ${formatarTempo(
    duracao
  )}`;
}

function mostrarTocando(tocando) {
  btnPlay.innerHTML = tocando ? ICONE_PAUSE : ICONE_PLAY;
  disco.classList.toggle("tocando", tocando);
  mini.classList.toggle("tocando", tocando);
}

async function tocar() {
  try {
    await player.play();
  } catch (erro) {
    // AbortError = trocou de música no meio do carregamento (normal)
    if (erro.name !== "AbortError") {
      console.error("Erro ao tocar:", erro);
    }
  }
}

function alternar() {
  if (player.paused) {
    tocar();
  } else {
    player.pause();
  }
}

function carregar(id) {
  const musica = musicas[id];
  if (!musica) return;

  idAtual = id;
  player.src = musica.audio;
  capa.src = musica.capa;
  miniCapa.src = musica.capa;
  titulo.textContent = musica.titulo;
  artista.textContent = musica.artista;
  anel.style.strokeDashoffset = CIRCUNFERENCIA;
  tempo.textContent = "0:00 / 0:00";
  mini.hidden = false;

  lista.querySelectorAll(".card").forEach((c) => {
    c.classList.toggle("ativo", c.dataset.id === id);
  });

  tocar();
}

// passo = 1 (próxima) ou -1 (anterior); volta ao início/fim da lista
function trocar(passo) {
  const ids = Object.keys(musicas);
  if (ids.length === 0) return;
  const i = ids.indexOf(idAtual);
  carregar(ids[(i + passo + ids.length) % ids.length]);
}

function abrirPlayer() {
  if (!modal.open) modal.showModal();
}

/* ---------- Lista (Read) ---------- */

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
  },
  (erro) => {
    console.error("Erro ao ler o banco:", erro);
    lista.innerHTML = "<p>Não foi possível carregar as músicas.</p>";
  }
);

/* ---------- Eventos ---------- */

// Clique num card: carrega a música (se for outra) e abre o player
lista.addEventListener("click", (e) => {
  const card = e.target.closest(".card");

  if (!card) return;

  const id = card.dataset.id;

  if (id !== idAtual || player.error) carregar(id);
  abrirPlayer();
});

// Clique no disco: na capa = play/pause | no anel = pular para aquele ponto
disco.addEventListener("click", (e) => {
  const r = disco.getBoundingClientRect();
  const x = e.clientX - (r.left + r.width / 2);
  const y = e.clientY - (r.top + r.height / 2);

  if (Math.hypot(x, y) < r.width * 0.43) {
    alternar();
    return;
  }

  if (!player.duration) return;
  let angulo = Math.atan2(x, -y); // 0 = topo, sentido horário
  if (angulo < 0) angulo += 2 * Math.PI;
  player.currentTime = (angulo / (2 * Math.PI)) * player.duration;
});

btnPlay.addEventListener("click", alternar);
btnAnterior.addEventListener("click", () => trocar(-1));
btnProxima.addEventListener("click", () => trocar(1));

btnFechar.addEventListener("click", () => modal.close());
mini.addEventListener("click", abrirPlayer);

// Clicar fora do player (no fundo escurecido) fecha
modal.addEventListener("click", (e) => {
  const r = modal.getBoundingClientRect();
  const fora =
    e.clientX < r.left ||
    e.clientX > r.right ||
    e.clientY < r.top ||
    e.clientY > r.bottom;
  if (fora) modal.close();
});

// Eventos do <audio>
player.addEventListener("play", () => mostrarTocando(true));
player.addEventListener("pause", () => mostrarTocando(false));
player.addEventListener("timeupdate", atualizarProgresso);
player.addEventListener("loadedmetadata", atualizarProgresso);
player.addEventListener("ended", () => trocar(1));

player.addEventListener("error", () => {
  console.error("Erro no áudio:", player.error, player.src);
  titulo.textContent = "Não foi possível tocar esta música";
  mostrarTocando(false);
});

// Capas quebradas no player
[capa, miniCapa].forEach((img) => {
  img.addEventListener("error", () => {
    if (!img.src.startsWith("data:")) img.src = CAPA_PADRAO;
  });
});