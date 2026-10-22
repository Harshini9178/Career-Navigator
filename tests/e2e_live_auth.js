async function runE2E() {
  const baseUrl = 'http://localhost:3000';
  console.log('--- Starting Live E2E Verification against localhost:3000 ---');

  // 1. Fetch Landing Page
  const homeRes = await fetch(baseUrl);
  const homeHtml = await homeRes.text();
  console.log(`[1] GET / -> status: ${homeRes.status}, contains Career Navigator: ${homeHtml.includes('Career Navigator')}`);
  if (homeRes.status !== 200) throw new Error('Home page failed to load');

  // Extract CSRF cookie if set
  const cookies = homeRes.headers.get('set-cookie') || '';
  const csrfMatch = cookies.match(/csrf-token=([^;]+)/);
  const csrfToken = csrfMatch ? csrfMatch[1] : '';
  console.log(`[2] CSRF Token established: ${csrfToken.slice(0, 10)}...`);

  // 2. Register New User
  const testEmail = `e2e_engineer_${Date.now()}@careernavigator.app`;
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'E2E Software Engineer',
      email: testEmail,
      password: 'ProdReadyPassword2026!',
      role: 'student'
    })
  });
  const regData = await regRes.json();
  const regCookie = regRes.headers.get('set-cookie') || '';
  console.log(`[3] POST /api/auth/register -> status: ${regRes.status}, success: ${regData.success}, user: ${regData.user?.name}`);
  if (!regData.success || regData.user?.password || regData.user?.passwordHash) {
    throw new Error('Registration failed or exposed password hash');
  }

  // 3. Extract Session Cookie
  const sessionMatch = regCookie.match(/session=([^;]+)/);
  const sessionCookie = sessionMatch ? `session=${sessionMatch[1]}` : '';
  console.log(`[4] Session cookie received: ${sessionCookie.slice(0, 20)}...`);

  // 4. Test Session Restoration via GET /api/auth/me
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: sessionCookie }
  });
  const meData = await meRes.json();
  console.log(`[5] GET /api/auth/me -> status: ${meRes.status}, authenticated: ${meData.authenticated}, user: ${meData.user?.email}`);
  if (!meData.authenticated || meData.user?.email !== testEmail) {
    throw new Error('Session restoration failed');
  }

  // 5. Test Failed Login (Wrong password)
  const failLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'WrongPassword999!' })
  });
  const failData = await failLoginRes.json();
  console.log(`[6] POST /api/auth/login (invalid password) -> status: ${failLoginRes.status}, error: ${failData.error}`);
  if (failLoginRes.status !== 401) throw new Error('Expected 401 for wrong password');

  // 6. Test Successful Login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'ProdReadyPassword2026!' })
  });
  const loginData = await loginRes.json();
  console.log(`[7] POST /api/auth/login (valid password) -> status: ${loginRes.status}, success: ${loginData.success}`);
  if (!loginData.success) throw new Error('Login failed with valid credentials');

  // 7. Test Forgot Password
  const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail })
  });
  const forgotData = await forgotRes.json();
  console.log(`[8] POST /api/auth/forgot-password -> status: ${forgotRes.status}, message: ${forgotData.message}, tokenProvided: ${Boolean(forgotData.resetToken)}`);
  if (!forgotData.success) throw new Error('Forgot password request failed');

  // 8. Test Reset Password
  const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: forgotData.resetToken,
      newPassword: 'BrandNewPassword2026!'
    })
  });
  const resetData = await resetRes.json();
  console.log(`[9] POST /api/auth/reset-password -> status: ${resetRes.status}, message: ${resetData.message}`);
  if (!resetData.success) throw new Error('Reset password execution failed');

  // 9. Login with New Password
  const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'BrandNewPassword2026!' })
  });
  const newLoginData = await newLoginRes.json();
  console.log(`[10] POST /api/auth/login (new password) -> status: ${newLoginRes.status}, success: ${newLoginData.success}`);
  if (!newLoginData.success) throw new Error('Login with new password failed');

  // 10. Test Logout
  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: sessionCookie }
  });
  const logoutCookie = logoutRes.headers.get('set-cookie') || '';
  console.log(`[11] POST /api/auth/logout -> status: ${logoutRes.status}, cookie cleared: ${logoutCookie.includes('Max-Age=0')}`);

  console.log('--- ALL LIVE E2E AUTHENTICATION JOURNEY CHECKS PASSED PERFECTLY! ---');
}

runE2E().catch((err) => {
  console.error('E2E Verification Error:', err);
  process.exit(1);
});
