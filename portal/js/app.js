import { 
  supabase, currentClientInfo, 
  updateClientProfile, createClientProfile, 
  fetchLogs, fetchDocuments, ingestDocument 
} from './api.js';
import { setupAuth, checkSession } from './auth.js';

// --- Globals & State ---
let activeTab = 'general';

// --- UI Helpers ---
export function toggleLoader(show, text = "Đang xử lý...") {
  const loader = document.getElementById('loader');
  const ltext = document.getElementById('loader-text');
  if (loader) loader.style.display = show ? 'flex' : 'none';
  if (ltext) ltext.innerText = text;
}

export function showAuthScreen() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('dashboard-screen').classList.add('hidden');
}

export function showDashboard(user, needsSetup, clientData = null) {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('dashboard-screen').classList.remove('hidden');
  document.getElementById('user-display').innerText = user.email;

  if (needsSetup) {
    document.getElementById('setup-company-msg').classList.remove('hidden');
    document.getElementById('company-slug').disabled = false;
  } else if (clientData) {
    populateConfig(clientData);
    updateEmbedCode(clientData.slug);
    loadDocsData(clientData.slug); // Initial load
  }
}

// --- Tab Logic ---
function switchTab(tabId) {
  activeTab = tabId;
  document.querySelectorAll('.tab-btn, .content-card').forEach(el => el.classList.remove('active'));
  
  const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  const card = document.getElementById(`tab-${tabId}`);
  
  if (btn) btn.classList.add('active');
  if (card) card.classList.add('active');

  // Trigger tab-specific loads
  if (tabId === 'logs' && currentClientInfo) {
    loadLogsData(currentClientInfo.slug);
  } else if (tabId === 'knowledge' && currentClientInfo) {
    loadDocsData(currentClientInfo.slug);
  }
}

// --- Data Population (Config Tab) ---
function populateConfig(clientData) {
  document.getElementById('company-name').value = clientData.name || '';
  document.getElementById('company-slug').value = clientData.slug || '';
  document.getElementById('company-slug').disabled = true; // Lock after creation
  document.getElementById('company-email').value = clientData.company_email || '';
  document.getElementById('sheet-id').value = clientData.spreadsheet_id || '';
}

// --- Event Listeners Setup ---
function setupDashboardEvents() {
  // Tab Switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      await supabase.auth.signOut();
      location.reload();
    };
  }

  // Copy Embed Code
  const copyBtn = document.getElementById('copy-btn');
  if (copyBtn) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(document.getElementById('embed-code').innerText);
      copyBtn.innerText = "Đã copy!";
      setTimeout(() => copyBtn.innerText = "Copy", 2000);
    };
  }

  // Config Update / Create
  const configForm = document.getElementById('config-form');
  if (configForm) {
    configForm.onsubmit = async (e) => {
      e.preventDefault();
      toggleLoader(true, "Lưu cấu hình...");
      
      const name = document.getElementById('company-name').value;
      const slug = document.getElementById('company-slug').value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      
      // Tự động bóc tách ID nếu người dùng lỡ dán cả đường link URL
      let sid = document.getElementById('sheet-id').value.trim();
      const match = sid.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        sid = match[1];
        document.getElementById('sheet-id').value = sid; // Fill lại lên UI cho đẹp
      }
      
      const email = document.getElementById('company-email').value;
      const msg = document.getElementById('config-msg');

      try {
        if (!currentClientInfo) {
          // Setup for new OAuth user
          const { data: { user } } = await supabase.auth.getUser();
          const { error } = await createClientProfile(user.id, name, slug, sid);
          if (error) throw error;
          window.location.reload(); // Hard reload to clear setup state
        } else {
          // Update existing
          const { error } = await updateClientProfile(currentClientInfo.id, name, sid, email);
          if (error) throw error;
          
          msg.innerText = "✅ Đã cập nhật thành công!";
          msg.className = "status-msg success";
        }
      } catch (err) {
        msg.innerText = "Lỗi: " + err.message;
        msg.className = "status-msg error";
      } finally {
        msg.classList.remove('hidden');
        msg.style.display = 'block';
        toggleLoader(false);
      }
    };
  }

  // Ingest Form
  const ingestForm = document.getElementById('ingest-form');
  if (ingestForm) {
    ingestForm.onsubmit = async (e) => {
      e.preventDefault();
      if (!currentClientInfo) return alert("Vui lòng lưu cấu hình công ty trước!");
      
      toggleLoader(true, "AI đang nạp tài liệu...");
      const file = document.getElementById('policy-file').files[0];
      const res = await ingestDocument(currentClientInfo.slug, currentClientInfo.spreadsheet_id, file);
      
      const msg = document.getElementById('ingest-msg');
      if (res.success) {
        msg.innerText = "✅ Đã nạp kiến thức thành công!";
        msg.className = "status-msg success";
        loadDocsData(currentClientInfo.slug);
      } else {
        msg.innerText = "Lỗi: " + res.error;
        msg.className = "status-msg error";
      }
      msg.classList.remove('hidden');
      msg.style.display = 'block';
      toggleLoader(false);
    };
  }
}

// --- Data Fetching & Rendering Methods ---
async function loadLogsData(slug) {
  const data = await fetchLogs(slug);
  const lBody = document.getElementById('leave-body');
  const mBody = document.getElementById('mod-body');
  
  if (data.success && data.data) {
    const rL = data.data.leaveRequests;
    lBody.innerHTML = rL.length ? rL.map(r => `<tr><td>${r.employee || 'N/A'}</td><td>${r.type}</td><td>${r.startDate || '-'}</td><td><span class="tag ${r.status==='approved'?'safe':r.status==='rejected'?'flagged':'pending'}">${r.status.toUpperCase()}</span></td></tr>`).join('') : '<tr><td colspan="4" class="row-empty">Chưa có đơn nghỉ phép</td></tr>';
    
    const rM = data.data.moderationLogs;
    mBody.innerHTML = rM.length ? rM.map(r => `<tr><td>${r.content.substring(0,30)}...</td><td><span class="tag ${r.result==='safe'?'safe':'flagged'}">${r.result.toUpperCase()}</span></td><td>${r.flags?.join(', ') || '-'}</td></tr>`).join('') : '<tr><td colspan="3" class="row-empty">Chưa có vi phạm</td></tr>';
  } else {
    lBody.innerHTML = mBody.innerHTML = '<tr><td colspan="4" class="row-empty">Lỗi tải dữ liệu</td></tr>';
  }
}

async function loadDocsData(slug) {
  const { data, error } = await fetchDocuments(slug);
  const list = document.getElementById('doc-list');
  if (error || !data.length) {
    list.innerHTML = "<p class='row-empty' style='margin-top:20px'>Chưa có tài liệu nào.</p>";
    return;
  }
  
  const sources = [...new Set(data.map(d => d.metadata.source))];
  list.innerHTML = `<h3 style="margin-top:20px;">Tài liệu đang kích hoạt:</h3><ul>` + 
    sources.map(s => `<li style="margin-bottom:8px;">📄 <strong>${s}</strong> <span class="tag safe" style="margin-left:8px;">Active</span></li>`).join('') + 
  `</ul>`;
}

function updateEmbedCode(slug) {
  document.getElementById('embed-code').innerText = `<script src="${window.location.origin}/sdk/agent.js" data-client-id="${slug}" data-api="${window.location.origin}/api/chat"><\/script>`;
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  setupAuth();
  setupDashboardEvents();
  checkSession();
});
