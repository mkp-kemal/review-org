(function (global) {
    global.auth = global.auth || {
        role: null
    };

    // reviews
    global.reviewState = global.reviewState || {
        currentReviewId: null,
        currentResponse: null,
        currentPage: 1,
        itemsPerPage: 10,
        allReviews: [],
        filteredReviews: [],

        // orgs
        currentPageOrg: 1,
        itemsPerPageOrg: 10,
        allOrgs: [],
        orgsList: [],

        // teams
        currentPageTeam: 1,
        itemsPerPageTeam: 10,
        allTeams: [],
        teamsList: []
    };

    // review
    global.currentReviewId = global.reviewState.currentReviewId;
    global.currentResponse = global.reviewState.currentResponse;
    global.currentPage = global.reviewState.currentPage;
    global.itemsPerPage = global.reviewState.itemsPerPage;
    global.allReviews = global.reviewState.allReviews;
    global.filteredReviews = global.reviewState.filteredReviews;

    // org
    global.currentPageOrg = global.reviewState.currentPageOrg;
    global.itemsPerPageOrg = global.reviewState.itemsPerPageOrg;
    global.allOrgs = global.reviewState.allOrgs;
    global.orgsList = global.reviewState.orgsList;

    // team
    global.currentPageTeam = global.reviewState.currentPageTeam;
    global.itemsPerPageTeam = global.reviewState.itemsPerPageTeam;
    global.allTeams = global.reviewState.allTeams;
    global.teamsList = global.reviewState.TeamsList;
})(window);

function loadSidebar() {
    fetch('sidebar.html')
        .then(response => response.text())
        .then(data => {
            const container = document.getElementById('sidebar-container');
            container.innerHTML = data;

            container.querySelectorAll("script").forEach(oldScript => {
                const newScript = document.createElement("script");
                if (oldScript.src) {
                    newScript.src = oldScript.src;
                } else {
                    newScript.textContent = oldScript.textContent;
                }
                document.body.appendChild(newScript);
            });

            if (window.user && window.user.role) {
                setTimeout(setupSidebarByRole, 50);
            }
        });
}

function loadPage(page) {
    const menuItems = document.querySelectorAll('.sidebar-menu li a');
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick').includes(page)) {
            item.classList.add('active');
        }
    });

    initPageScripts(page);
}
let currentPage = null;

function initPageScripts(page) {
    if (page === currentPage) {
        return;
    }
    currentPage = page;

    if (page === 'organizations') {
        fetch('organizations.html')
            .then(res => res.text())
            .then(html => {
                const container = document.getElementById('main-content');
                container.innerHTML = html;

                container.querySelectorAll("script").forEach(oldScript => {
                    const newScript = document.createElement("script");
                    if (oldScript.src) {
                        newScript.src = oldScript.src; 
                    } else {
                        newScript.textContent = oldScript.textContent; 
                    }
                    document.body.appendChild(newScript);
                });
            });

    } else if (page === 'teams') {
        fetch('teams.html')
            .then(res => res.text())
            .then(html => {
                const container = document.getElementById('main-content');
                container.innerHTML = html;

                container.querySelectorAll("script").forEach(oldScript => {
                    const newScript = document.createElement("script");
                    if (oldScript.src) {
                        newScript.src = oldScript.src; 
                    } else {
                        newScript.textContent = oldScript.textContent; 
                    }
                    document.body.appendChild(newScript);
                });
            });
    } else if (page === 'reviews') {
        fetch('reviews.html')
            .then(res => res.text())
            .then(html => {
                const container = document.getElementById('main-content');
                container.innerHTML = html;

                container.querySelectorAll("script").forEach(oldScript => {
                    const newScript = document.createElement("script");
                    if (oldScript.src) {
                        newScript.src = oldScript.src; 
                    } else {
                        newScript.textContent = oldScript.textContent; 
                    }
                    document.body.appendChild(newScript);
                });
            });
    } else if (page === "logs") {
        fetch('logs.html')
            .then(res => res.text())
            .then(html => {
                const container = document.getElementById('main-content');
                container.innerHTML = html;

                container.querySelectorAll("script").forEach(oldScript => {
                    const newScript = document.createElement("script");
                    if (oldScript.src) {
                        newScript.src = oldScript.src; 
                    } else {
                        newScript.textContent = oldScript.textContent; 
                    }
                    document.body.appendChild(newScript);
                });
            });
    }else if (page === "users") {
        fetch('users.html')
            .then(res => res.text())
            .then(html => {
                const container = document.getElementById('main-content');
                container.innerHTML = html;

                container.querySelectorAll("script").forEach(oldScript => {
                    const newScript = document.createElement("script");
                    if (oldScript.src) {
                        newScript.src = oldScript.src; 
                    } else {
                        newScript.textContent = oldScript.textContent; 
                    }
                    document.body.appendChild(newScript);
                });
            });
    } else if (page === "settings") {
        fetch('settings.html')
            .then(res => res.text())
            .then(html => {
                const container = document.getElementById('main-content');
                container.innerHTML = html;

                container.querySelectorAll("script").forEach(oldScript => {
                    const newScript = document.createElement("script");
                    if (oldScript.src) {
                        newScript.src = oldScript.src; 
                    } else {
                        newScript.textContent = oldScript.textContent; 
                    }
                    document.body.appendChild(newScript);
                });
            });
    }
}


async function checkCredentials() {
    try {
        const res = await fetchWithAuth(`${window.APP_CONFIG.API_URL}/auth/check`, {
            method: "GET"
        });

        if (!res || !res.ok) {
            window.location.replace('/Login.html');
            return { isAuthenticated: false };
        } else {
            let data = await res.json();

            if (data.user.role === 'REVIEWER') {
                window.location.href = '/';
                return { isAuthenticated: false };
            } else {
                window.user = data.user;

                setTimeout(() => {
                    if (typeof setupSidebarByRole === 'function') {
                        setupSidebarByRole();
                    }

                    // Default page berdasarkan role
                    if (window.user.role === 'TEAM_ADMIN') {
                        loadPage('teams');
                    } else {
                        loadPage('organizations');
                    }
                }, 100);

                return { data };
            }
        }
    } catch (err) {
        console.error("checkCredentials error:", err);
        return { isAuthenticated: false };
    }
}

// Load sidebar when page loads
document.addEventListener('DOMContentLoaded', function () {
    checkCredentials().then((res) => {
        loadSidebar();

        const observer = new MutationObserver(() => {
            const orgFileInput = document.getElementById('orgCsvFile');
            if (orgFileInput && !orgFileInput.dataset.bound) {
                orgFileInput.dataset.bound = true;
                orgFileInput.addEventListener('change', (e) => {
                    const fileName = e.target.files[0] ? e.target.files[0].name : 'No file chosen';
                    document.getElementById('orgCsvFileName').textContent = fileName;
                });
                console.log("Orgs event bound");
            }
        });

        observer.observe(document.getElementById("main-content"), { childList: true, subtree: true });
    });
});