import { supabase, fetchClientProfile, createClientProfile } from './api.js';
import { showDashboard, showAuthScreen, toggleLoader } from './app.js';

let isRegisterMode = false;

export function setupAuth() {
  const authForm = document.getElementById('auth-form');
  const authToggleBtn = document.getElementById('auth-toggle');
  
  if (authToggleBtn) {
    authToggleBtn.onclick = (e) => {
      e.preventDefault();
      isRegisterMode = !isRegisterMode;
      document.getElementById('auth-title').innerText = isRegisterMode ? 'Đăng ký công ty' : 'Chào mừng trở lại';
      document.getElementById('register-fields').classList.toggle('hidden', !isRegisterMode);
      document.getElementById('auth-toggle-text').innerText = isRegisterMode ? 'Đã có tài khoản?' : 'Chưa có tài khoản?';
      authToggleBtn.innerText = isRegisterMode ? 'Đăng nhập ngay' : 'Đăng ký ngay';
    };
  }

  if (authForm) {
    authForm.onsubmit = async (e) => {
      e.preventDefault();
      toggleLoader(true, "Đang xử lý tài khoản...");
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        if (isRegisterMode) {
          const name = document.getElementById('reg-company-name').value;
          const slug = document.getElementById('reg-company-slug').value.toLowerCase().replace(/[^a-z0-9-]/g, '');
          
          if (!name || !slug) throw new Error("Vui lòng nhập Tên công ty và Slug.");
          
          const { data, error } = await supabase.auth.signUp({ email, password });
          if (error) throw error;
          
          // Create client record immediately
          await createClientProfile(data.user.id, name, slug, "");
          alert("Gần xong! Hãy kiểm tra email để xác thực tài khoản.");
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          location.reload(); // Reload to trigger session check
        }
      } catch (err) {
        showAuthMsg(err.message, "error");
      }
      toggleLoader(false);
    };
  }

  // Bind OAuth globally so inline onclick works
  window.loginOAuth = async (provider) => {
    toggleLoader(true, "Chuyển hướng đăng nhập...");
    await supabase.auth.signInWithOAuth({ 
      provider, 
      options: { redirectTo: window.location.origin + '/dashboard' } 
    });
  };
}

export async function checkSession() {
  toggleLoader(true, "Kiểm tra phiên làm việc...");
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    const { data: clientData, error } = await fetchClientProfile(session.user.id);
    
    // Check if new OAuth user needs to set up company info
    if (error || !clientData) {
      showDashboard(session.user, true); // true = requires setup
    } else {
      showDashboard(session.user, false, clientData);
    }
  } else {
    showAuthScreen();
  }
  toggleLoader(false);
}

export function showAuthMsg(msg, type = "error") {
  const el = document.getElementById('auth-msg');
  if (el) {
    el.innerText = msg;
    el.className = `status-msg ${type}`;
    el.style.display = 'block';
  } else {
    alert(msg);
  }
}
