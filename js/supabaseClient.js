// =====================================================
// What'sToday · supabaseClient.js — Supabase OAuth Client
// =====================================================

// __SUPABASE_URL__ / __SUPABASE_ANON_KEY__ 는 빌드 타임에 Vite가 주입 (vite.config.js)
const SUPABASE_URL      = window.__SUPABASE_URL__;
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__;

// window.supabase 는 CDN <script>가 띄운 전역 (createClient 함수 포함)
// 만든 클라이언트를 전역 sb 로 노출 (api.js / shared.js 패턴과 동일)
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

