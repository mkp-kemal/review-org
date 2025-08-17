async function loadReviews() {
    // Initialize all star ratings
    document.querySelectorAll('.star-rating').forEach(ratingContainer => {
        const stars = ratingContainer.querySelectorAll('.fa-star');
        const hiddenInput = ratingContainer.querySelector('input[type="hidden"]');
        const category = ratingContainer.dataset.category;

        stars.forEach(star => {
            // Hover effect
            star.addEventListener('mouseover', () => {
                const rating = parseInt(star.dataset.rating);
                highlightStars(ratingContainer, rating);
            });

            // Click event
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                hiddenInput.value = rating;
                ratingContainer.dataset.rating = rating;
                highlightStars(ratingContainer, rating);
            });

            // Reset to selected rating when mouse leaves
            ratingContainer.addEventListener('mouseleave', () => {
                const currentRating = parseInt(ratingContainer.dataset.rating || '0');
                highlightStars(ratingContainer, currentRating);
            });
        });
    });

    // Team/Organization search functionality
    const teamSearch = document.getElementById('team-search');
    const suggestions = document.getElementById('suggestions');
    const teamSuggestions = document.getElementById('team-suggestions');
    // const orgSuggestions = document.getElementById('org-suggestions');
    const teamIdInput = document.getElementById('team-id');
    // const orgIdInput = document.getElementById('organization-id');

    let debounceTimer;
    teamSearch.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        const searchTerm = this.value.trim();

        if (searchTerm.length < 2) {
            suggestions.classList.add('hidden');
            return;
        }

        debounceTimer = setTimeout(() => {
            fetchSuggestions(searchTerm);
        }, 300);
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', function (e) {
        if (!teamSearch.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.add('hidden');
        }
    });

    function fetchSuggestions(searchTerm) {
        fetch(`${window.APP_CONFIG.API_URL}/orgs/with/teams?search=${encodeURIComponent(searchTerm)}`)
            .then(response => response.json())
            .then(data => {
                displaySuggestions(data);
            })
            .catch(error => {
                console.error('Error fetching suggestions:', error);
            });
    }

    function displaySuggestions(data) {
        // Clear previous suggestions
        teamSuggestions.innerHTML = '';
        // orgSuggestions.innerHTML = '';

        // Display teams
        if (data.teams && data.teams.length > 0) {
            data.teams.forEach(team => {
                const teamElement = document.createElement('div');
                teamElement.className = 'inline-block p-3 m-2 border rounded-lg cursor-pointer hover:bg-gray-100';
                teamElement.innerHTML = `
                    <div class="font-semibold">${team.organization.name} ${team.ageLevel}</div>
                    <div class="text-sm text-gray-600">${team.city}, ${team.state}</div>
                `;
                teamElement.addEventListener('click', () => {
                    teamSearch.value = `${team.organization.name} ${team.ageLevel}`;
                    teamIdInput.value = team.id;
                    // orgIdInput.value = team.organizationId;
                    suggestions.classList.add('hidden');
                });
                teamSuggestions.appendChild(teamElement);
            });
        } else {
            teamSuggestions.innerHTML = '<div class="p-3 text-gray-500">No teams found</div>';
        }

        // Display organizations
        // if (data.orgs && data.orgs.length > 0) {
        //     data.orgs.forEach(org => {
        //         const orgElement = document.createElement('div');
        //         orgElement.className = 'inline-block p-3 m-2 border rounded-lg cursor-pointer hover:bg-gray-100';
        //         orgElement.innerHTML = `
        //             <div class="font-semibold">${org.name}</div>
        //             <div class="text-sm text-gray-600">${org.city}, ${org.state}</div>
        //         `;
        //         orgElement.addEventListener('click', () => {
        //             teamSearch.value = org.name;
        //             orgIdInput.value = org.id;
        //             teamIdInput.value = '';
        //             suggestions.classList.add('hidden');
        //         });
        //         orgSuggestions.appendChild(orgElement);
        //     });
        // } else {
        //     orgSuggestions.innerHTML = '<div class="p-3 text-gray-500">No organizations found</div>';
        // }

        suggestions.classList.remove('hidden');
    }

    function getOrCreateUserId() {
        let userId = localStorage.getItem("userId");
        if (!userId) {
            userId = crypto.randomUUID();
            localStorage.setItem("userId", userId);
        }
        return userId;
    }

    function getJwtFromCookie() {
        const match = document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/);
        
        return match ? decodeURIComponent(match[1]) : null;
    }

    async function checkCredentials() {
        try {
            const res = await fetch(`${window.APP_CONFIG.API_URL}/auth/check`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${getJwtFromCookie()}`
                }
            });

            if (!res.ok) {
                return { isAuthenticated: false };
            }

            const data = await res.json();
            return data;
        } catch (err) {
            return { isAuthenticated: false };
        }
    }


    document.getElementById('reviewForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        Swal.showLoading();

        const formData = new FormData(this);

        const reviewData = {
            title: formData.get('title'),
            body: formData.get('body'),
            season: formData.get('season'),
            coaching: parseInt(formData.get('coaching')),
            development: parseInt(formData.get('development')),
            transparency: parseInt(formData.get('transparency')),
            culture: parseInt(formData.get('culture')),
            safety: parseInt(formData.get('safety')),
            teamId: formData.get('teamId'),
        };

        const token = getJwtFromCookie();
        let isLoggedIn = false;
        if (token) {
            try {
                const decoded = jwt_decode(token);
                if (decoded && decoded.sub) {
                    isLoggedIn = true;
                }
            } catch (err) {
                console.warn("Invalid JWT, treat as anonymous");
            }
        }

        if (!isLoggedIn) {
            reviewData.userId = getOrCreateUserId();
        }

        const auth = await checkCredentials();
        if (auth.isAuthenticated) {

        } else {
            reviewData.userId = getOrCreateUserId();
        }

        fetch(`${window.APP_CONFIG.API_URL}/teams/${reviewData.teamId}/reviews`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getJwtFromCookie()}`
             },
            credentials: 'include',
            body: JSON.stringify(reviewData)
        })
            .then(res => res.json())
            .then(data => {
                if (data.createdAt) {
                    Swal.fire({ title: "Success", text: "Review submitted successfully!", icon: "success" });
                    this.reset();
                    resetAllStarRatings();
                } else {
                    Swal.fire({ title: "Error", text: `${data.message}`, icon: "error" });
                }
            });
    });

}
function highlightStars(container, rating) {
    const stars = container.querySelectorAll('.fa-star');
    stars.forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        if (starRating <= rating) {
            star.classList.remove('far');
            star.classList.add('fas', 'text-yellow-400');
        } else {
            star.classList.remove('fas', 'text-yellow-400');
            star.classList.add('far');
        }
    });
}

function resetAllStarRatings() {
    document.querySelectorAll('.star-rating').forEach(ratingContainer => {
        const hiddenInput = ratingContainer.querySelector('input[type="hidden"]');
        if (hiddenInput) {
            hiddenInput.value = 0;
            ratingContainer.dataset.rating = 0;
            highlightStars(ratingContainer, 0);
        }
    });
}
