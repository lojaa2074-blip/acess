// ============================================================
// CONFIGURAÇÃO DO SUPABASE
// Troque pelos dados do SEU projeto (Project Settings > API)
// ============================================================
const SUPABASE_URL = "https://csmbmqvvrvagktrfgeqp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbWJtcXZ2cnZhZ2t0cmZnZXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNzEyMzMsImV4cCI6MjEwMDc0NzIzM30.Y75Om7i_t4QsXOjZbGl8lzrV65I53zbzQilx1qQo8t0";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const TABLE = "access";

// ---------- estado ----------
let allRows = [];
let editingId = null;
let deletingId = null;

// ---------- elementos ----------
const rowsContainer = document.getElementById("rowsContainer");
const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");
const tableHead = document.getElementById("tableHead");
const searchInput = document.getElementById("searchInput");

const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalForm = document.getElementById("modalForm");
const fieldCodigo = document.getElementById("fieldCodigo");
const fieldNome = document.getElementById("fieldNome");
const fieldCnpj = document.getElementById("fieldCnpj");
const fieldSenha = document.getElementById("fieldSenha");

// Permite digitar apenas números no CNPJ, limitado a 14 dígitos
fieldCnpj.addEventListener("input", () => {
  fieldCnpj.value = fieldCnpj.value.replace(/\D/g, "").slice(0, 14);
});

const deleteOverlay = document.getElementById("deleteOverlay");
const deleteText = document.getElementById("deleteText");

const toast = document.getElementById("toast");

// ============================================================
// CARREGAR DADOS
// ============================================================
async function loadRows() {
  loadingState.style.display = "block";
  emptyState.style.display = "none";
  rowsContainer.innerHTML = "";

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("codigo", { ascending: true });

  loadingState.style.display = "none";

  if (error) {
    showToast("Erro ao carregar dados: " + error.message, "error");
    console.error(error);
    return;
  }

  allRows = data || [];
  renderRows(allRows);
}

function renderRows(rows) {
  rowsContainer.innerHTML = "";

  if (!rows.length) {
    emptyState.style.display = "block";
    tableHead.style.display = "none";
    return;
  }
  emptyState.style.display = "none";

  rows.forEach((row) => {
    rowsContainer.appendChild(buildRowElement(row));
  });
}

function buildRowElement(row) {
  const el = document.createElement("div");
  el.className = "row row-data";
  el.dataset.id = row.id;

  el.innerHTML = `
    <div class="col col-codigo">
      <div class="field-line">
        <span class="row-label">Código</span>
        <span>${escapeHtml(row.codigo || "")}</span>
      </div>
    </div>

    <div class="col col-nome">
      <div class="field-line">
        <span class="row-label">Nome</span>
        <span>${escapeHtml(row.nome || "")}</span>
      </div>
    </div>

    <div class="col col-cnpj">
      <div class="field-line">
        <span class="row-label">CNPJ</span>
        <span class="mono">${escapeHtml(row.cnpj || "")}</span>
      </div>
      <button class="icon-btn copy" title="Copiar CNPJ" data-action="copy-cnpj">
        ${iconCopy()}
      </button>
    </div>

    <div class="col col-senha">
      <div class="field-line">
        <span class="row-label">Senha</span>
        <span class="senha-mask">••••••••</span>
      </div>
      <button class="icon-btn edit" title="Editar" data-action="edit">
        ${iconEdit()}
      </button>
      <button class="icon-btn copy" title="Copiar senha" data-action="copy-senha">
        ${iconCopy()}
      </button>
    </div>

    <div class="col col-acoes">
      <button class="icon-btn delete" title="Excluir" data-action="delete">
        ${iconTrash()}
      </button>
    </div>
  `;

  el.querySelector('[data-action="copy-cnpj"]').addEventListener("click", () => {
    copyToClipboard(row.cnpj, "CNPJ copiado!");
  });
  el.querySelector('[data-action="copy-senha"]').addEventListener("click", () => {
    copyToClipboard(row.senha, "Senha copiada!");
  });
  el.querySelector('[data-action="edit"]').addEventListener("click", () => {
    openEditModal(row);
  });
  el.querySelector('[data-action="delete"]').addEventListener("click", () => {
    openDeleteModal(row);
  });

  return el;
}

// ============================================================
// BUSCA
// ============================================================
searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) {
    renderRows(allRows);
    if (allRows.length) tableHead.style.display = "";
    return;
  }
  const filtered = allRows.filter((r) =>
    (r.codigo || "").toLowerCase().includes(q) ||
    (r.nome || "").toLowerCase().includes(q) ||
    (r.cnpj || "").toLowerCase().includes(q)
  );
  renderRows(filtered);
  if (filtered.length) tableHead.style.display = "";
});

// ============================================================
// MODAL INCLUIR / EDITAR
// ============================================================
document.getElementById("btnAdd").addEventListener("click", openAddModal);
document.getElementById("btnAddEmpty").addEventListener("click", openAddModal);
document.getElementById("btnCancel").addEventListener("click", closeModal);

function openAddModal() {
  editingId = null;
  modalTitle.textContent = "Incluir registro";
  fieldCodigo.value = "";
  fieldNome.value = "";
  fieldCnpj.value = "";
  fieldSenha.value = "";
  modalOverlay.classList.add("active");
  setTimeout(() => fieldCodigo.focus(), 50);
}

function openEditModal(row) {
  editingId = row.id;
  modalTitle.textContent = "Editar registro";
  fieldCodigo.value = row.codigo || "";
  fieldNome.value = row.nome || "";
  fieldCnpj.value = row.cnpj || "";
  fieldSenha.value = row.senha || "";
  modalOverlay.classList.add("active");
  setTimeout(() => fieldCodigo.focus(), 50);
}

function closeModal() {
  modalOverlay.classList.remove("active");
  editingId = null;
}

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

modalForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    codigo: fieldCodigo.value.trim(),
    nome: fieldNome.value.trim(),
    cnpj: fieldCnpj.value.replace(/\D/g, "").slice(0, 14),
    senha: fieldSenha.value.trim(),
  };

  const submitBtn = modalForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Salvando...";

  let error;
  if (editingId) {
    ({ error } = await supabase.from(TABLE).update(payload).eq("id", editingId));
  } else {
    ({ error } = await supabase.from(TABLE).insert(payload));
  }

  submitBtn.disabled = false;
  submitBtn.textContent = "Salvar";

  if (error) {
    showToast("Erro ao salvar: " + error.message, "error");
    console.error(error);
    return;
  }

  showToast(editingId ? "Registro atualizado!" : "Registro incluído!", "success");
  closeModal();
  loadRows();
});

// ============================================================
// EXCLUIR
// ============================================================
document.getElementById("btnCancelDelete").addEventListener("click", closeDeleteModal);
deleteOverlay.addEventListener("click", (e) => {
  if (e.target === deleteOverlay) closeDeleteModal();
});

function openDeleteModal(row) {
  deletingId = row.id;
  deleteText.textContent = `Tem certeza que deseja excluir "${row.nome || row.codigo}"? Essa ação não pode ser desfeita.`;
  deleteOverlay.classList.add("active");
}

function closeDeleteModal() {
  deleteOverlay.classList.remove("active");
  deletingId = null;
}

document.getElementById("btnConfirmDelete").addEventListener("click", async () => {
  if (!deletingId) return;
  const btn = document.getElementById("btnConfirmDelete");
  btn.disabled = true;
  btn.textContent = "Excluindo...";

  const { error } = await supabase.from(TABLE).delete().eq("id", deletingId);

  btn.disabled = false;
  btn.textContent = "Excluir";

  if (error) {
    showToast("Erro ao excluir: " + error.message, "error");
    console.error(error);
    return;
  }

  showToast("Registro excluído!", "success");
  closeDeleteModal();
  loadRows();
});

// ============================================================
// COPIAR
// ============================================================
async function copyToClipboard(text, successMsg) {
  if (!text) {
    showToast("Nada para copiar.", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMsg, "success");
  } catch (err) {
    // fallback para navegadores/contextos sem permissão de clipboard
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
    showToast(successMsg, "success");
  }
}

// ============================================================
// UTILITÁRIOS
// ============================================================
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

let toastTimer;
function showToast(msg, type = "success") {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className = "toast show " + type;
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function iconCopy() {
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
}
function iconEdit() {
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>`;
}
function iconTrash() {
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
loadRows();
