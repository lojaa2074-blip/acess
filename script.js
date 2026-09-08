// ============================================================
// CONFIGURAÇÃO DO SUPABASE
// Troque pelos dados do SEU projeto (Project Settings > API)
// ============================================================
const SUPABASE_URL = "https://csmbmqvvrvagktrfgeqp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbWJtcXZ2cnZhZ2t0cmZnZXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNzEyMzMsImV4cCI6MjEwMDc0NzIzM30.Y75Om7i_t4QsXOjZbGl8lzrV65I53zbzQilx1qQo8t0";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
const toggleFieldSenha = document.getElementById("toggleFieldSenha");

toggleFieldSenha.addEventListener("click", () => {
  const isHidden = fieldSenha.type === "password";
  fieldSenha.type = isHidden ? "text" : "password";
  toggleFieldSenha.innerHTML = isHidden ? iconEyeOff() : iconEye();
  toggleFieldSenha.title = isHidden ? "Ocultar senha" : "Mostrar senha";
});

function resetSenhaVisibility() {
  fieldSenha.type = "password";
  toggleFieldSenha.innerHTML = iconEye();
  toggleFieldSenha.title = "Mostrar senha";
}

// Permite digitar apenas números no CNPJ, limitado a 14 dígitos
fieldCnpj.addEventListener("input", () => {
  fieldCnpj.value = fieldCnpj.value.replace(/\D/g, "").slice(0, 14);
});

const deleteOverlay = document.getElementById("deleteOverlay");
const deleteText = document.getElementById("deleteText");

const toast = document.getElementById("toast");

// ============================================================
// BLOQUEIO POR SENHA
// ============================================================
const APP_PASSWORD = "@asdf";
const lockScreen = document.getElementById("lockScreen");
const appContent = document.getElementById("appContent");
const lockForm = document.getElementById("lockForm");
const lockPassword = document.getElementById("lockPassword");
const lockError = document.getElementById("lockError");

function unlockApp() {
  lockScreen.style.display = "none";
  appContent.style.display = "";
  sessionStorage.setItem("accessUnlocked", "true");
  loadRows();
  pingHeartbeat();
}

// ============================================================
// HEARTBEAT (mantém o projeto Supabase ativo)
// Atualiza um registro simples sempre que o app é acessado/desbloqueado,
// gerando atividade no banco para evitar a pausa por inatividade.
// ============================================================
async function pingHeartbeat() {
  try {
    await supabaseClient
      .from("heartbeat")
      .update({ atualizado_em: new Date().toISOString() })
      .eq("id", 1);
  } catch (err) {
    console.warn("Não foi possível atualizar o heartbeat:", err);
  }
}

lockForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (lockPassword.value === APP_PASSWORD) {
    lockError.style.display = "none";
    unlockApp();
  } else {
    lockError.style.display = "block";
    lockPassword.value = "";
    lockPassword.focus();
  }
});

if (sessionStorage.getItem("accessUnlocked") === "true") {
  unlockApp();
} else {
  setTimeout(() => lockPassword.focus(), 100);
}

// ============================================================
// CARREGAR DADOS
// ============================================================
async function loadRows() {
  loadingState.style.display = "block";
  emptyState.style.display = "none";
  rowsContainer.innerHTML = "";

  try {
    const { data, error } = await supabaseClient
      .from(TABLE)
      .select("*")
      .order("dn", { ascending: true });

    if (error) {
      loadingState.style.display = "none";
      showToast("Erro ao carregar dados: " + error.message, "error");
      console.error(error);
      return;
    }

    allRows = data || [];
    loadingState.style.display = "none";
    renderRows(allRows);
  } catch (err) {
    loadingState.style.display = "none";
    showToast("Erro inesperado ao carregar dados.", "error");
    console.error(err);
  }
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
        <span>${escapeHtml(row.dn || "")}</span>
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
      <button class="icon-btn toggle-senha" title="Mostrar senha" data-action="toggle-senha">
        ${iconEye()}
      </button>
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
  let senhaVisivel = false;
  const senhaSpan = el.querySelector(".senha-mask");
  const toggleBtn = el.querySelector('[data-action="toggle-senha"]');
  toggleBtn.addEventListener("click", () => {
    senhaVisivel = !senhaVisivel;
    senhaSpan.textContent = senhaVisivel ? (row.senha || "") : "••••••••";
    toggleBtn.innerHTML = senhaVisivel ? iconEyeOff() : iconEye();
    toggleBtn.title = senhaVisivel ? "Ocultar senha" : "Mostrar senha";
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
    (r.dn || "").toLowerCase().includes(q) ||
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
  resetSenhaVisibility();
  modalOverlay.classList.add("active");
  setTimeout(() => fieldCodigo.focus(), 50);
}

function openEditModal(row) {
  editingId = row.id;
  modalTitle.textContent = "Editar registro";
  fieldCodigo.value = row.dn || "";
  fieldNome.value = row.nome || "";
  fieldCnpj.value = row.cnpj || "";
  fieldSenha.value = row.senha || "";
  resetSenhaVisibility();
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
    dn: fieldCodigo.value.trim(),
    nome: fieldNome.value.trim(),
    cnpj: fieldCnpj.value.replace(/\D/g, "").slice(0, 14),
    senha: fieldSenha.value.trim(),
  };

  const submitBtn = modalForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Salvando...";

  let error;
  if (editingId) {
    ({ error } = await supabaseClient.from(TABLE).update(payload).eq("id", editingId));
  } else {
    ({ error } = await supabaseClient.from(TABLE).insert(payload));
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
  deleteText.textContent = `Tem certeza que deseja excluir "${row.nome || row.dn}"? Essa ação não pode ser desfeita.`;
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

  const { error } = await supabaseClient.from(TABLE).delete().eq("id", deletingId);

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
// BACKUP EM EXCEL
// Baixa todos os registros da tabela em um arquivo .xlsx
// ============================================================
const btnBackup = document.getElementById("btnBackup");

btnBackup.addEventListener("click", async () => {
  const originalHtml = btnBackup.innerHTML;
  btnBackup.disabled = true;
  btnBackup.textContent = "Gerando...";

  try {
    const { data, error } = await supabaseClient
      .from(TABLE)
      .select("*")
      .order("dn", { ascending: true });

    if (error) throw error;

    if (!data || !data.length) {
      showToast("Nenhum registro para exportar.", "error");
      return;
    }

    const dataToExport = data.map((row) => ({
      "Código": row.dn || "",
      "Nome": row.nome || "",
      "CNPJ": row.cnpj || "",
      "Senha": row.senha || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet["!cols"] = [{ wch: 14 }, { wch: 30 }, { wch: 18 }, { wch: 18 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Access");

    const hoje = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `access_backup_${hoje}.xlsx`);

    showToast("Backup gerado com sucesso!", "success");
  } catch (err) {
    console.error(err);
    showToast("Erro ao gerar backup: " + (err.message || "erro desconhecido"), "error");
  } finally {
    btnBackup.disabled = false;
    btnBackup.innerHTML = originalHtml;
  }
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
function iconEye() {
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
}
function iconEyeOff() {
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.3 20.3 0 0 1 5.06-5.94"></path><path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a20.3 20.3 0 0 1-2.16 3.19"></path><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
}
function iconTrash() {
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
// loadRows() agora é chamado dentro de unlockApp(), após a senha correta.
