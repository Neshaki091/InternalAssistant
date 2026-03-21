// api.js - Centralized Supabase and Backend API calls

const SB_URL = "https://ldtzbfdqhoyspgjetuzp.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkdHpiZmRxaG95c3BnamV0dXpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2NDYyNCwiZXhwIjoyMDg5NjQwNjI0fQ.YI9znpgrdEHk4oXACW_3X8hwFo-0kP-RRgJodbNzvPM"; 

export const supabase = window.supabase.createClient(SB_URL, SB_KEY);
export let currentClientInfo = null;

export const setClientInfo = (info) => { currentClientInfo = info; };

export async function fetchClientProfile(userId) {
  const { data, error } = await supabase.from('clients').select('*').eq('user_id', userId).maybeSingle();
  if (data) setClientInfo(data);
  return { data, error };
}

export async function updateClientProfile(id, name, spreadsheetId, companyEmail) {
  const { error } = await supabase.from('clients').update({ name, spreadsheet_id: spreadsheetId, company_email: companyEmail }).eq('id', id);
  if (!error && currentClientInfo) {
    currentClientInfo.name = name;
    currentClientInfo.spreadsheet_id = spreadsheetId;
    currentClientInfo.company_email = companyEmail;
  }
  return { error };
}

export async function createClientProfile(userId, name, slug, spreadsheetId) {
  const { data, error } = await supabase.from('clients').insert([{ 
    user_id: userId, name, slug, spreadsheet_id: spreadsheetId 
  }]).select().single();
  if (data) setClientInfo(data);
  return { data, error };
}

export async function fetchLogs(slug) {
  try {
    const res = await fetch(`/api/logs?clientId=${slug}`);
    return await res.json();
  } catch (err) {
    console.error("API error fetching logs", err);
    return { success: false, data: { leaveRequests: [], moderationLogs: [] } };
  }
}

export async function fetchDocuments(slug) {
  const { data, error } = await supabase.from('documents').select('metadata').eq('client_id', slug);
  return { data: data || [], error };
}

export async function ingestDocument(slug, spreadsheetId, file) {
  const fd = new FormData();
  fd.append('clientId', slug);
  fd.append('spreadsheetId', spreadsheetId || "");
  fd.append('policyFile', file);
  
  try {
    const res = await fetch('/api/ingest', { method: 'POST', body: fd });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}
