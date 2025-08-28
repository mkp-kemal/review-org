// 🔹 TOGGLE FORMS
function toggleForms() {
    document.getElementById('login-form').classList.toggle('hidden');
    document.getElementById('signup-form').classList.toggle('hidden');
    document.getElementById('reset-form').classList.add('hidden'); // hide reset
}

function toggleReset() {
    document.getElementById('login-form').classList.toggle('hidden');
    document.getElementById('reset-form').classList.toggle('hidden');
    document.getElementById('signup-form').classList.add('hidden'); // hide signup
}

// 🔹 LOGIN HANDLER
document.querySelector('#login-form form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${window.APP_CONFIG.API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (res.ok) {
            const data = await res.json();
            document.cookie = `accessToken=${data.accessToken}; path=/`;
            document.cookie = `refreshToken=${data.refreshToken}; path=/`;
            window.location.href = '/';
        } else {
            const errorData = await res.json();
            throw new Error(errorData.message);
        }
    } catch (error) {
        Swal.fire({
            title: `Error`,
            text: `Login failed: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK',
            background: '#f9fafb',
            color: '#111827',
            confirmButtonColor: '#2563eb'
        });
    }
});

// 🔹 REGISTER HANDLER
document.querySelector('#signup-form form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-password-confirm').value;

    if (password !== confirmPassword) {
        return Swal.fire({
            title: 'Error',
            text: 'Passwords do not match',
            icon: 'error',
            confirmButtonText: 'OK',
            background: '#f9fafb',
            color: '#111827',
            confirmButtonColor: '#ef4444'
        });
    }

    try {
        const res = await fetch(`${window.APP_CONFIG.API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (res.ok) {
            Swal.fire({
                title: 'Success',
                text: 'Verification email has been sent. Please check your inbox.',
                icon: 'success',
                confirmButtonText: 'OK',
                background: '#f9fafb',
                color: '#111827',
                confirmButtonColor: '#22c55e'
            }).then(() => {
                toggleForms();
            });
        } else {
            const errorData = await res.json();
            throw new Error(errorData.message);
        }
    } catch (error) {
        Swal.fire({
            title: `Error`,
            text: `Registration failed: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK',
            background: '#f9fafb',
            color: '#111827',
            confirmButtonColor: '#ef4444'
        });
    }
});

// 🔹 RESET PASSWORD HANDLER
document.querySelector('#reset-form form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;

    try {
        const res = await fetch(`${window.APP_CONFIG.API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (res.ok) {
            Swal.fire({
                title: 'Success',
                text: 'Password reset link has been sent to your email.',
                icon: 'success',
                confirmButtonText: 'OK',
                background: '#f9fafb',
                color: '#111827',
                confirmButtonColor: '#22c55e'
            }).then(() => toggleReset());
        } else {
            const errorData = await res.json();
            throw new Error(errorData.message);
        }
    } catch (error) {
        Swal.fire({
            title: 'Error',
            text: `Failed to send reset link: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK',
            background: '#f9fafb',
            color: '#111827',
            confirmButtonColor: '#ef4444'
        });
    }
});