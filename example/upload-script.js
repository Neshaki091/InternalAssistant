/**
 * Example Policy Upload Script
 */

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('upload-form');
  const dropArea = document.getElementById('drop-area');
  const fileInput = document.getElementById('file-input');
  const fileNameDiv = document.getElementById('file-name');
  const clientIdInput = document.getElementById('clientId');
  const submitBtn = document.getElementById('submit-btn');
  const statusDiv = document.getElementById('status');

  let selectedFile = null;

  // Click to open file dialog
  dropArea.addEventListener('click', () => fileInput.click());

  // Drag & Drop visual effects
  ['dragenter', 'dragover'].forEach(name => {
    dropArea.addEventListener(name, (e) => {
      e.preventDefault();
      dropArea.classList.add('active');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropArea.addEventListener(name, (e) => {
      e.preventDefault();
      dropArea.classList.remove('active');
    });
  });

  // Handle drop
  dropArea.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length) handleFileSelect(files[0]);
  });

  // Handle click upload
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFileSelect(e.target.files[0]);
  });

  function handleFileSelect(file) {
    selectedFile = file;
    fileNameDiv.textContent = '✓ ' + file.name;
    fileNameDiv.style.display = 'block';
    validateForm();
  }

  clientIdInput.addEventListener('input', validateForm);

  function validateForm() {
    submitBtn.disabled = !(clientIdInput.value.trim() && selectedFile);
  }

  // Submit Logic
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang xử lý...';
    statusDiv.style.display = 'none';

    const formData = new FormData();
    formData.append('clientId', clientIdInput.value.trim());
    formData.append('spreadsheetId', 'example-sheet-' + clientIdInput.value.trim());
    formData.append('policyFile', selectedFile);

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        statusDiv.className = 'success';
        statusDiv.innerHTML = `<strong>Thành công!</strong><br>${data.message}`;
        form.reset();
        selectedFile = null;
        fileNameDiv.style.display = 'none';
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err) {
      statusDiv.className = 'error';
      statusDiv.innerHTML = `<strong>Lỗi:</strong> ${err.message}`;
    } finally {
      submitBtn.textContent = 'Bắt đầu Huấn luyện AI 🚀';
      validateForm();
      statusDiv.style.display = 'block';
    }
  });
});
