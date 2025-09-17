document.addEventListener("DOMContentLoaded", async () => {
    let user = await checkAuth();

    if (["SITE_ADMIN", "ORG_ADMIN", "TEAM_ADMIN"].includes(user?.role)) {
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

    if (user?.role === "SITE_ADMIN") {
        document.getElementById("confirmUpgrade").style.display = "none";
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


    if (!user) {
        document.getElementById("buttonPro")?.addEventListener("click", () => {
            window.location.href = "/Login.html";
        });


        document.getElementById("buttonElite")?.addEventListener("click", () => {
            window.location.href = "/Login.html";
        });
    } else {
        document.getElementById("buttonPro")?.addEventListener("click", () => {
            currentPlan = "PRO";
            window.currentPlan = "PRO";

            document.getElementById("upgradeTitle").innerText = "Upgrade to PRO";
            document.getElementById("benefitsList").innerHTML = benefits.PRO;
            $('#upgradeModal').modal('show');


            loadEntities(upgradeType.value);
        });


        document.getElementById("buttonElite")?.addEventListener("click", () => {
            currentPlan = "ELITE";
            window.currentPlan = "ELITE";

            document.getElementById("upgradeTitle").innerText = "Upgrade to ELITE";
            document.getElementById("benefitsList").innerHTML = benefits.ELITE;
            $('#upgradeModal').modal('show');


            loadEntities(upgradeType.value);
        });
    }


    upgradeType?.addEventListener("change", (e) => {
        loadEntities(e.target.value);
    });



    async function loadEntities(type) {
        const parentEntityList = document.getElementById("parent-entity-list");


        parentEntityList.innerHTML = `
        <label for="entityList">Select:</label>
        <select id="entityList" class="form-control" disabled>
            <option>Loading...</option>
        </select>
    `;

        const confirmBtn = document.getElementById("confirmUpgrade");
        if (confirmBtn) confirmBtn.disabled = true;

        if (type) {
            const func = type === "team" ? loadTeamsClaimed : loadOrganizationsClaimed;
            try {
                const res = await func();

                if (!res || res.length === 0) {
                    parentEntityList.innerHTML = `
                    <p class="text-gray-500 italic">No data available</p>
                `;
                    return;
                }


                parentEntityList.innerHTML = `
                <label for="entityList">Select:</label>
                <select id="entityList" class="form-control">
                    <option value="">-- Select --</option>
                </select>
            `;
                const entityList = parentEntityList.querySelector("#entityList");


                res.forEach(item => {
                    const option = document.createElement("option");
                    option.value = item.id;
                    option.textContent = item.name;
                    entityList.appendChild(option);
                });


                if (confirmBtn) {
                    confirmBtn.disabled = true;
                    entityList.addEventListener("change", () => {
                        confirmBtn.disabled = !entityList.value;
                    });
                }

            } catch (err) {
                parentEntityList.innerHTML = `
                <p class="text-red-600 font-semibold">
                    You must claim the ${type} to upgrade
                </p>
            `;
                console.error(err);
            }
        } else {
            parentEntityList.innerHTML = `
            <p class="text-gray-500 italic">No data available</p>
        `;
        }
    }


    document.getElementById("confirmUpgrade")?.addEventListener("click", async () => {
        const entityList = document.getElementById("entityList");
        const selectedId = entityList?.value;
        const type = document.getElementById("upgradeType")?.value;

        if (!selectedId) {
            alert("Please select a Team or Organization!");
            return;
        }

        try {

            const body = {
                plan: currentPlan
            };
            if (type === "team") {
                body.teamId = selectedId;
            } else {
                body.organizationId = selectedId;
            }

            const checkSessionCheckout = await fetch(`${window.APP_CONFIG.API_URL}/billing/checkout/save/${selectedId}?plan=${currentPlan}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getCookie("accessToken")}`
                },
            })

            const data = await checkSessionCheckout.json();

            if (data?.url) {
                window.open(data.url, "_blank");
            } else {
                const res = await fetch(`${window.APP_CONFIG.API_URL}/billing/checkout-session`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getCookie("accessToken")}`
                    },
                    body: JSON.stringify(body)
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData?.message || "Failed to create checkout session");
                }

                const data = await res.json();

                if (data?.url) {
                    window.open(data.url, "_blank");
                } else {
                    alert("Checkout session did not return a valid URL");
                }
            }




            // $('#upgradeModal').modal('hide');
        } catch (err) {
            console.error("confirmUpgrade error:", err);
            swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Failed: ${err instanceof Error ? err.message : String(err)}`
            })
        }
    });


});


document.addEventListener('DOMContentLoaded', loadTeams);


// document.addEventListener('DOMContentLoaded', loadReviews);

document.addEventListener('DOMContentLoaded', function() {
    new ReviewFormManager();
});


document.addEventListener('DOMContentLoaded', loadSeasonYears);


function initTeamSearch(inputElement, options = {}) {
    const { hiddenInput } = options;


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

async function loadOrganizationsClaimed() {
    try {
        const res = await fetch(`${window.APP_CONFIG.API_URL}/orgs/access/claimby/${window.currentPlan}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getCookie('accessToken')}`
            }
        });
        if (!res.ok) throw new Error("Failed to load organizations");


        const text = await res.text();
        if (!text) return [];

        return JSON.parse(text);
    } catch (err) {
        swal.fire('Warning', 'You must claim a team first', 'warning');
        return [];
    }
}

async function loadTeamsClaimed() {
    try {
        const res = await fetch(`${window.APP_CONFIG.API_URL}/teams/access/claimby/${window.currentPlan}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getCookie('accessToken')}`
            }
        });
        if (!res.ok) throw new Error("Failed to load teams");

        const text = await res.text();
        if (!text) return [];

        return JSON.parse(text);
    } catch (err) {
        swal.fire('Warning', 'You must claim a team first', 'warning');
        return [];
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    const heroInput = document.querySelector('.hero-section input[type="text"]');
    const reviewInput = document.getElementById('team-big-search');
    const teamIdInput = document.getElementById('team-id');
    
    initTeamSearch(heroInput);
    initTeamSearch(reviewInput, { hiddenInput: teamIdInput });
});