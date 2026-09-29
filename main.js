const modal = document.getElementById("modal");

document.getElementById("btn-abrir").addEventListener("click", () => {
  modal.showModal();
});

document.getElementById("btn-cancelar").addEventListener("click", () => {
  modal.close();
});