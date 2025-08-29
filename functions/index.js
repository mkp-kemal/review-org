document.addEventListener("DOMContentLoaded", async () => {
    let user = await checkAuth();

    if (["SITE_ADMIN", "ORG_ADMIN", "TEAM_ADMIN"].includes(user.role)) {
        const formEl = document.querySelector("#review-form form");
        if (formEl) {
            formEl.classList.add("relative");

            const overlay = document.createElement("div");
            overlay.className = "overlay-block";
            overlay.innerHTML = `
                    <i class="fas fa-ban"></i>
                    <p class="font-bold text-red-600 text-lg">You are not allowed to submit a review</p>
                `;

            formEl.appendChild(overlay);
        }
    }

    const benefits = {
        PRO: `
      <ul class="text-left mb-3">
        <li><i class="fas fa-check-circle text-success mr-2"></i>All Basic features, plus:</li>
        <li><i class="fas fa-check-circle text-success mr-2"></i>Respond to reviews</li>
        <li><i class="fas fa-check-circle text-success mr-2"></i>Add photos & videos</li>
        <li><i class="fas fa-check-circle text-success mr-2"></i>Detailed team description</li>
      </ul>
    `,
        ELITE: `
      <ul class="text-left mb-3">
        <li><i class="fas fa-check-circle text-success mr-2"></i>All Pro features, plus:</li>
        <li><i class="fas fa-check-circle text-success mr-2"></i>Highlight a positive review</li>
        <li><i class="fas fa-check-circle text-success mr-2"></i>Post tryout listings</li>
        <li><i class="fas fa-check-circle text-success mr-2"></i>Remove competitor ads</li>
        <li><i class="fas fa-check-circle text-success mr-2"></i>Access basic analytics</li>
      </ul>
    `
    };

    let currentPlan = null;

    const entityList = document.getElementById("entityList");
    const upgradeType = document.getElementById("upgradeType");

    // Event tombol PRO
    document.getElementById("buttonPro")?.addEventListener("click", () => {
        currentPlan = "PRO";
        document.getElementById("upgradeTitle").innerText = "Upgrade to PRO";
        document.getElementById("benefitsList").innerHTML = benefits.PRO;
        $('#upgradeModal').modal('show');

        // Trigger load default entity list
        loadEntities(upgradeType.value);
    });

    // Event tombol ELITE
    document.getElementById("buttonElite")?.addEventListener("click", () => {
        currentPlan = "ELITE";
        document.getElementById("upgradeTitle").innerText = "Upgrade to ELITE";
        document.getElementById("benefitsList").innerHTML = benefits.ELITE;
        $('#upgradeModal').modal('show');

        // Trigger load default entity list
        loadEntities(upgradeType.value);
    });

    // Ketika ganti tipe upgrade Team / Org
    upgradeType?.addEventListener("change", (e) => {
        loadEntities(e.target.value);
    });

    // Load dropdown list Team / Organization
    function loadEntities(type) {
        entityList.innerHTML = `<option value="">-- Select --</option>`; // reset

        if(type){
            const data = type === "team" ? loadTeamPlan() : loadOrganizationPlan();
            
            data.forEach(item => {
                const option = document.createElement("option");
                option.value = item.id;
                option.textContent = item.name;
                entityList.appendChild(option);
            });
        }

    }

    // Confirm button
    document.getElementById("confirmUpgrade")?.addEventListener("click", () => {
        const selectedId = entityList.value;
        const type = upgradeType.value;
        if (!selectedId) {
            alert("Please select a Team or Organization!");
            return;
        }
        alert(`Upgrading ${type.toUpperCase()} (${selectedId}) to ${currentPlan} plan!`);
        $('#upgradeModal').modal('hide');
    });

    // Dummy functions (bisa diganti API call)
    function loadTeamPlan() {
        console.log("Loading Team data...");
        return [
            { id: 1, name: "Team A" },
            { id: 2, name: "Team B" },
            { id: 3, name: "Team C" }
        ]
    }

    function loadOrganizationPlan() {
        console.log("Loading Organization data...");
        return [
            { id: 1, name: "Org A" },
            { id: 2, name: "Org B" },
            { id: 3, name: "Org C" }
        ]
    }
});

// LOAD REVIEW FROM TEAMS & ORGANIZATION ===================================================================
document.addEventListener('DOMContentLoaded', loadTeams());

// LOAD REVIEW FROM TEAMS & ORGANIZATION ===================================================================
document.addEventListener('DOMContentLoaded', loadReviews());


document.addEventListener('DOMContentLoaded', loadSeasonYears);


function initTeamSearch(inputElement, options = {}) {
    const { hiddenInput } = options;

    // Buat dropdown container jika belum ada
    let suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto hidden';
    inputElement.parentElement.appendChild(suggestionsContainer);

    let debounceTimer;

    inputElement.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const term = inputElement.value.trim();
        if (term.length < 2) {
            suggestionsContainer.classList.add('hidden');
            return;
        }

        debounceTimer = setTimeout(() => {
            fetch(`${window.APP_CONFIG.API_URL}/orgs/with/teams?search=${encodeURIComponent(term)}`)
                .then(res => res.json())
                .then(data => {
                    suggestionsContainer.innerHTML = '';

                    // Sticky header
                    const header = document.createElement('div');
                    header.className = 'sticky top-0 bg-gray-100 p-2 font-semibold border-b text-gray-600';
                    header.textContent = 'Teams';
                    suggestionsContainer.appendChild(header);

                    if (data.teams && data.teams.length) {
                        const teamWrapper = document.createElement('div');
                        teamWrapper.className = 'overflow-y-auto max-h-80';

                        data.teams.forEach(team => {
                            const div = document.createElement('div');
                            div.className = 'p-3 cursor-pointer hover:bg-gray-100 border-b last:border-b-0';
                            div.innerHTML = `
                                <div class="font-semibold text-blue-500">${team.name} ${team.ageLevel}</div>
                                <div class="text-sm text-gray-600">${team.organization.name}, ${team.state}</div>
                            `;
                            div.addEventListener('click', () => {
                                if (hiddenInput) hiddenInput.value = team.id;
                                window.location.href = `Org_profile.html?id=${team.id}`;
                            });
                            teamWrapper.appendChild(div);
                        });
                        suggestionsContainer.appendChild(teamWrapper);
                    } else {
                        const noResult = document.createElement('div');
                        noResult.className = 'p-3 text-gray-500';
                        noResult.textContent = 'No teams found';
                        suggestionsContainer.appendChild(noResult);
                    }

                    suggestionsContainer.classList.remove('hidden');
                })
                .catch(err => console.error(err));
        }, 300);
    });

    // Hide suggestions if clicking outside
    document.addEventListener('click', e => {
        if (!inputElement.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.classList.add('hidden');
        }
    });
}

async function loadSeasonYears() {
    try {
        const res = await fetch(`${window.APP_CONFIG.API_URL}/teams/years`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getCookie('accessToken')}`
            }
        });
        if (!res.ok) throw new Error("Failed to load years");

        const data = await res.json();

        const select = document.getElementById('season-year');

        data.years.forEach(year => {
            const opt = document.createElement('option');
            opt.value = year;
            opt.textContent = year;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error("loadSeasonYears error:", err);
    }
}

// --- Inisialisasi search ---
// Hero big search
const heroInput = document.querySelector('.hero-section input[type="text"]');
initTeamSearch(heroInput);

// Review form search
const reviewInput = document.getElementById('team-big-search');
const teamIdInput = document.getElementById('team-id');
initTeamSearch(reviewInput, { hiddenInput: teamIdInput });