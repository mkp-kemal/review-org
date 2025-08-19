async function checkAuth() {
    try {
        const res = await fetchWithAuth(`${window.APP_CONFIG.API_URL}/auth/me`);
        const loginLink = document.getElementById('login-link');

        if (!loginLink) return;

        if (!res || !res.ok) {
            sessionStorage.removeItem("user");
            showLogoutButton(loginLink);
            return;
        }

        const user = await res.json();

        if (user && user.email) {
            sessionStorage.setItem("user", JSON.stringify(user));

            // const username = user.email.split('@')[0];
            loginLink.textContent = 'Logout';
            loginLink.href = '#';
            loginLink.onclick = showLogoutConfirmation;
        } else {
            sessionStorage.removeItem("user");
            showLogoutButton(loginLink);
        }

    } catch (err) {
        console.error('You are not logged in - ANONYMOUS', err);
        sessionStorage.removeItem("user");
        const loginLink = document.getElementById('login-link');
        if (loginLink) {
            showLogoutButton(loginLink);
        }
    }
}

function showLogoutButton(linkEl) {
    linkEl.textContent = "Login";
    linkEl.href = "Login.html";
    linkEl.onclick = null;
}

// Pastikan dipanggil setelah DOM siap
document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
});


function showLogoutConfirmation(event) {
    event.preventDefault();
    Swal.fire({
        title: 'Konfirmasi Logout',
        text: 'Apakah Anda yakin ingin logout?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, logout'
    }).then((result) => {
        if (result.isConfirmed) {
            logout();
        }
    });
}

async function logout() {
    try {
        // Hapus cookies
        document.cookie = 'accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

        // Redirect ke halaman login
        window.location.href = 'Login.html';
    } catch (err) {
        console.error('Logout error:', err);
        window.location.href = 'Login.html';
    }
}

async function fetchWithAuth(url, options = {}) {
    let accessToken = getCookie('accessToken');
    let res = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${accessToken}`
        }
    });

    // Kalau token expired
    if (res.status === 401) {
        const refreshToken = getCookie('refreshToken');
        if (!refreshToken) {
            // window.location.href = 'Login.html';
            return;
        }

        // Minta token baru
        const refreshRes = await fetch(`${window.APP_CONFIG.API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });

        if (!refreshRes.ok) {
            // window.location.href = 'Login.html';
            return;
        }

        const data = await refreshRes.json();
        // Simpan ulang cookie
        document.cookie = `accessToken=${data.accessToken}; path=/`;
        document.cookie = `refreshToken=${data.refreshToken}; path=/`;

        // Ulang request dengan token baru
        res = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${data.accessToken}`
            }
        });
    }

    return res;
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
