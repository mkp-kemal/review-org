class ReviewFormManager {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateProgressLine();
        this.loadSeasonYears();
        this.checkAuth();
    }

    setupEventListeners() {
        // Setup star ratings
        this.setupStarRatings();

        // Setup team search
        this.setupTeamSearch();

        // Setup form validation
        this.setupFormValidation();

        // Load reviews
        document.addEventListener('DOMContentLoaded', () => {
            loadReviews();
        });
    }

    goToStep(step) {
        if (step < 1 || step > this.totalSteps) return;

        // Hide current step
        document.getElementById(`form-step-${this.currentStep}`).classList.add('hidden');

        // Update step indicators
        const currentIndicator = document.getElementById(`step-indicator-${this.currentStep}`);
        if (step > this.currentStep) {
            currentIndicator.classList.remove('active');
            currentIndicator.classList.add('completed');
        } else if (step < this.currentStep) {
            currentIndicator.classList.remove('completed');
            currentIndicator.classList.add('active');
        }

        // Show new step
        this.currentStep = step;
        document.getElementById(`form-step-${this.currentStep}`).classList.remove('hidden');

        // Update active indicator
        const newIndicator = document.getElementById(`step-indicator-${this.currentStep}`);
        newIndicator.classList.add('active');
        newIndicator.classList.remove('inactive');

        // Update progress line
        this.updateProgressLine();

        // Scroll to top of form
        document.getElementById('multi-step-form').scrollIntoView({ behavior: 'smooth' });
    }

    updateProgressLine() {
        const progressLine = document.getElementById('progress-line');
        const progressPercentage = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;

        // Set the background gradient for the progress line
        progressLine.style.background = `linear-gradient(to right, #16a34a 0%, #16a34a ${progressPercentage}%, #d1d5db ${progressPercentage}%, #d1d5db 100%)`;
    }

    setupStarRatings() {
        document.querySelectorAll('.star-rating').forEach(ratingContainer => {
            const stars = ratingContainer.querySelectorAll('.fa-star');
            const hiddenInput = ratingContainer.querySelector('input[type="hidden"]');

            stars.forEach(star => {
                star.addEventListener('click', () => {
                    const rating = parseInt(star.dataset.rating);
                    hiddenInput.value = rating;
                    ratingContainer.dataset.rating = rating;

                    // Highlight stars
                    stars.forEach(s => {
                        const starRating = parseInt(s.dataset.rating);
                        if (starRating <= rating) {
                            s.classList.remove('far');
                            s.classList.add('fas');
                        } else {
                            s.classList.remove('fas');
                            s.classList.add('far');
                        }
                    });

                    // Enable next button if all ratings are set
                    this.checkStep2Completion();
                });

                star.addEventListener('mouseover', () => {
                    const rating = parseInt(star.dataset.rating);
                    stars.forEach(s => {
                        const starRating = parseInt(s.dataset.rating);
                        if (starRating <= rating) {
                            s.classList.add('fas');
                            s.classList.remove('far');
                        } else {
                            s.classList.add('far');
                            s.classList.remove('fas');
                        }
                    });
                });

                ratingContainer.addEventListener('mouseleave', () => {
                    const currentRating = parseInt(ratingContainer.dataset.rating || '0');
                    stars.forEach(s => {
                        const starRating = parseInt(s.dataset.rating);
                        if (starRating <= currentRating) {
                            s.classList.add('fas');
                            s.classList.remove('far');
                        } else {
                            s.classList.add('far');
                            s.classList.remove('fas');
                        }
                    });
                });
            });
        });
    }

    setupTeamSearch() {
        const teamSearch = document.getElementById('team-search');
        const suggestions = document.getElementById('suggestions');
        const teamSuggestions = document.getElementById('team-suggestions');
        const teamIdInput = document.getElementById('team-id');

        let debounceTimer;

        teamSearch.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            const searchTerm = teamSearch.value.trim();

            if (searchTerm.length < 2) {
                suggestions.classList.add('hidden');
                this.checkStep1Completion();
                return;
            }

            debounceTimer = setTimeout(() => {
                this.fetchSuggestions(searchTerm).then(data => {
                    this.displaySuggestions(data, teamSearch, teamIdInput, suggestions, teamSuggestions);
                }).catch(err => {
                    console.error('Error fetching suggestions:', err);
                    suggestions.classList.add('hidden');
                });
            }, 300);
        });

        document.addEventListener('click', (e) => {
            if (!teamSearch.contains(e.target) && !suggestions.contains(e.target)) {
                suggestions.classList.add('hidden');
            }
        });
    }

    async fetchSuggestions(searchTerm) {
        const response = await fetch(`${window.APP_CONFIG.API_URL}/orgs/with/teams?search=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch suggestions');
        }
        return await response.json();
    }

    displaySuggestions(data, teamSearch, teamIdInput, suggestions, teamSuggestions) {
        teamSuggestions.innerHTML = '';

        if (data.teams && data.teams.length > 0) {
            data.teams.forEach(team => {
                const teamElement = document.createElement('div');
                teamElement.className = 'inline-block p-3 m-2 border rounded-lg cursor-pointer hover:bg-gray-100';
                teamElement.innerHTML = `
                            <div class="font-semibold">${team.name} ${team.ageLevel}</div>
                            <div class="text-sm text-gray-600">${team.organization.name} - ${team.city}</div>
                        `;
                teamElement.addEventListener('click', () => {
                    teamSearch.value = `${team.name} ${team.ageLevel}`;
                    teamIdInput.value = team.id;
                    suggestions.classList.add('hidden');
                    this.checkStep1Completion();
                });
                teamSuggestions.appendChild(teamElement);
            });
        } else {
            teamSuggestions.innerHTML = '<div class="p-3 text-gray-500">No teams found</div>';
        }

        suggestions.classList.remove('hidden');
    }

    setupFormValidation() {
        // Step 1 validation
        const requiredFieldsStep1 = ['team-search', 'season', 'season-year'];
        requiredFieldsStep1.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            field.addEventListener('input', () => {
                this.checkStep1Completion();
            });
        });

        // Step 2 validation
        const ratingInputs = document.querySelectorAll('.star-rating input[type="hidden"]');
        ratingInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.checkStep2Completion();
            });
        });

        // Step 3 validation
        const requiredFieldsStep3 = ['review-title', 'review-body'];
        requiredFieldsStep3.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            field.addEventListener('input', () => {
                this.checkStep3Completion();
            });
        });

        // Form submission
        document.getElementById('reviewForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitReview();
        });
    }

    checkStep1Completion() {
        const teamSearch = document.getElementById('team-search').value.trim();
        const season = document.getElementById('season').value;
        const seasonYear = document.getElementById('season-year').value;
        const teamId = document.getElementById('team-id').value;

        const isComplete = teamSearch && season && seasonYear && teamId;
        const nextButton = document.getElementById('step1-next-btn');

        if (isComplete) {
            nextButton.classList.remove('cursor-not-allowed', 'opacity-50');
            nextButton.disabled = false;
        } else {
            nextButton.classList.add('cursor-not-allowed', 'opacity-50');
            nextButton.disabled = true;
        }
    }

    checkStep2Completion() {
        const ratingInputs = document.querySelectorAll('.star-rating input[type="hidden"]');
        let allRated = true;

        ratingInputs.forEach(input => {
            if (parseInt(input.value) === 0) {
                allRated = false;
            }
        });

        const nextButton = document.getElementById('step2-next-btn');

        if (allRated) {
            nextButton.classList.remove('cursor-not-allowed', 'opacity-50');
            nextButton.disabled = false;
        } else {
            nextButton.classList.add('cursor-not-allowed', 'opacity-50');
            nextButton.disabled = true;
        }
    }

    checkStep3Completion() {
        // Step 3 doesn't need validation for next button since we have required attributes
        // and we're not disabling the next button for this step
    }

    async loadSeasonYears() {
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

    async checkAuth() {
        try {
            const res = await fetchWithAuth(`${window.APP_CONFIG.API_URL}/auth/me`);
            const user = await res.json();
            
            if (user && user.email) {
                sessionStorage.setItem("user", JSON.stringify(user));

                // Redirect if user is admin
                if (["SITE_ADMIN", "ORG_ADMIN", "TEAM_ADMIN"].includes(user.role)) {
                    window.location.href = '/';
                }
            } else {
                sessionStorage.removeItem("user");
            }
        } catch (err) {
            console.error('You are not logged in - ANONYMOUS', err);
            sessionStorage.removeItem("user");
        }
    }

    async submitReview() {
        Swal.showLoading();

        const formData = new FormData(document.getElementById('reviewForm'));
        const reviewData = {
            title: formData.get('title'),
            body: formData.get('body'),
            season_term: formData.get('season'),
            season_year: parseInt(formData.get('seasonYear')),
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
                if (decoded && decoded.sub) isLoggedIn = true;
            } catch (err) {
                console.warn("Invalid JWT, treat as anonymous");
            }
        }

        if (!isLoggedIn) reviewData.userId = this.getOrCreateUserId();

        const auth = await this.checkCredentials();
        if (!auth.isAuthenticated) reviewData.userId = this.getOrCreateUserId();

        try {
            const response = await fetch(`${window.APP_CONFIG.API_URL}/teams/${reviewData.teamId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getJwtFromCookie()}`
                },
                credentials: 'include',
                body: JSON.stringify(reviewData)
            });

            const data = await response.json();

            if (data.createdAt) {
                Swal.fire({
                    title: "Success",
                    text: "Review submitted successfully!",
                    icon: "success",
                    timer: 3000,
                    showConfirmButton: false
                });

                // Reset form and go back to step 1
                document.getElementById('reviewForm').reset();
                this.resetAllStarRatings();
                this.goToStep(1);
            } else {
                Swal.fire({
                    title: "Error",
                    text: `${data.message}`,
                    icon: "error"
                });
            }
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: "Failed to submit review. Please try again.",
                icon: "error"
            });
            console.error("Error submitting review:", error);
        }
    }

    getOrCreateUserId() {
        let userId = localStorage.getItem("userId");
        if (!userId) {
            userId = crypto.randomUUID();
            localStorage.setItem("userId", userId);
        }
        return userId;
    }

    async checkCredentials() {
        try {
            const res = await fetch(`${window.APP_CONFIG.API_URL}/auth/check`, {
                method: "GET",
                headers: { 'Authorization': `Bearer ${getJwtFromCookie()}` }
            });

            if (!res.ok) return { isAuthenticated: false };
            return await res.json();
        } catch (err) {
            return { isAuthenticated: false };
        }
    }

    resetAllStarRatings() {
        document.querySelectorAll('.star-rating').forEach(ratingContainer => {
            const hiddenInput = ratingContainer.querySelector('input[type="hidden"]');
            if (hiddenInput) {
                hiddenInput.value = 0;
                ratingContainer.dataset.rating = 0;

                const stars = ratingContainer.querySelectorAll('.fa-star');
                stars.forEach(star => {
                    star.classList.remove('fas');
                    star.classList.add('far');
                });
            }
        });
    }
}

// Helper functions (kept for backward compatibility)
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function getJwtFromCookie() {
    const match = document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

async function fetchWithAuth(url, options = {}) {
    const token = getJwtFromCookie();
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    return await fetch(url, options);
}