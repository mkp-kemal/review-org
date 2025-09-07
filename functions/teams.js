async function loadTeams() {
    try {
        const res = await fetch(`${window.APP_CONFIG.API_URL}/teams/reviews/public?sort=rating`);
        if (!res.ok) throw new Error('Gagal mengambil data tim');

        const reviews = await res.json();

        
        const teamsMap = {};
        reviews.forEach(r => {
            const teamKey = r.teamId; 
            if (!teamsMap[teamKey]) {
                teamsMap[teamKey] = {
                    reviews: [],
                    team: r.team,
                    organization: r.team.organization,
                };
            }
            teamsMap[teamKey].reviews.push(r);
        });

        const container = document.getElementById('teams-container');
        container.innerHTML = '';

        
        if (!reviews.length || Object.keys(teamsMap).length === 0) {
                    document.getElementById('no-available-data').innerHTML = '<p class="text-red-500">Not yet available review</p>';
            return;
        }

        
        Object.values(teamsMap).forEach(({ reviews, team, organization }) => {
            let avgOverall = 0;
            let bestReview = null;
            let starsHtml = '';

            if (reviews.length > 0) {
                
                avgOverall = reviews.reduce((acc, cur) => acc + cur.rating.overall, 0) / reviews.length;

                
                bestReview = reviews.reduce((best, cur) =>
                    (cur.rating.overall > best.rating.overall ? cur : best),
                    reviews[0]
                );

                
                const fullStars = Math.floor(avgOverall);
                const halfStar = avgOverall % 1 >= 0.5;
                for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fas fa-star"></i>';
                if (halfStar) starsHtml += '<i class="fas fa-star-half-alt"></i>';
                for (let i = starsHtml.match(/fa-star/g)?.length || 0; i < 5; i++) starsHtml += '<i class="far fa-star"></i>';
            }

            const card = `
                <div class="bg-white rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
                    <div class="p-6">
                        <h3 class="text-2xl font-bold mb-2">${team.name}</h3>
                        <p class="text-gray-500 mb-4">${organization.name} - ${team.city} | ${team.ageLevel}</p>
                        
                        ${
                            reviews.length > 0
                            ? `
                                <div class="flex items-center mb-4">
                                    <div class="text-2xl font-bold text-blue-600 mr-3">${avgOverall.toFixed(1)}</div>
                                    <div class="star-rating">${starsHtml}</div>
                                    <div class="text-gray-500 ml-3">(${reviews.length} Reviews)</div>
                                </div>
                                <p class="text-gray-700 mb-4 italic">"${bestReview.body}"</p>
                                <a href="#team-profile" class="font-bold text-blue-600 hover:underline view-profile-btn" data-teamid="${team.id}">View Full Profile &rarr;</a>
                            `
                            : `
                                <p class="text-gray-500 italic">Not yet review</p>
                            `
                        }
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });

        setupViewProfileButtons(teamsMap);

    } catch (err) {
        console.error(err);
        document.getElementById('teams-container').innerHTML = '<p class="text-red-500">Gagal memuat data tim.</p>';
    }
}

function setupViewProfileButtons(teamsMap) {
    document.querySelectorAll('.view-profile-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            const teamId = btn.getAttribute('data-teamid');
            const teamData = teamsMap[teamId];
            if (teamData) {
                renderTeamProfile(teamData);
                document.getElementById('team-profile').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}


function renderTeamProfile(teamData) {
    const { reviews, team, organization } = teamData;

    
    const avg = (key) => {
        const sum = reviews.reduce((acc, cur) => acc + (cur.rating?.[key] || 0), 0);
        return (sum / reviews.length).toFixed(1);
    };

    const avgOverall = (reviews.reduce((a, c) => a + (c.rating?.overall || 0), 0) / reviews.length).toFixed(1);
    const reviewCount = reviews.length;

    
    const fullStars = Math.floor(avgOverall);
    const halfStar = avgOverall % 1 >= 0.5;
    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fas fa-star"></i>';
    if (halfStar) starsHtml += '<i class="fas fa-star-half-alt"></i>';
    for (let i = starsHtml.match(/fa-star/g)?.length || 0; i < 5; i++) starsHtml += '<i class="far fa-star"></i>';

    
    const sortedReviews = reviews.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    
    const ratingsHtml = `
        ${renderRatingRow('Coaching Quality', avg('coaching'), 'bg-blue-600')}
        ${renderRatingRow('Player Development', avg('development'), 'bg-blue-600')}
        ${renderRatingRow('Financial Transparency', avg('transparency'), 'bg-yellow-500')}
        ${renderRatingRow('Team Culture', avg('culture'), 'bg-blue-600')}
        ${renderRatingRow('Safety & Health', avg('safety'), 'bg-green-500')}
    `;

    
    const reviewsHtml = sortedReviews.map(r => `
        <div class="p-6 border rounded-lg">
            <div class="flex justify-between items-center mb-3">
                <h4 class="text-lg font-bold">"${r.title || 'Review'}" ${window?.user?.email === r.user.email ? '(You)' : ""}</h4>
                <div class="star-rating">
                    ${renderStars(r.rating?.overall || 0)}
                </div>
            </div>
            <p class="text-gray-600 mb-4">${r.body}</p>
            <p class="text-sm text-gray-500">Reviewed ${new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</p>

            ${r.orgResponse ? `
                <div class="p-6 border rounded-lg bg-gray-50 ml-8 mt-4">
                    <h4 class="text-lg font-bold text-gray-800 mb-2">
                        <i class="fas fa-building mr-2"></i>Response from ${organization.name}
                    </h4>
                    <p class="text-gray-600 mb-4">${r.orgResponse.body}</p>
                    <p class="text-sm text-gray-500">Posted ${new Date(r.editedAt || r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</p>
                </div>
            ` : ''}
        </div>
    `).join('');

    document.getElementById('team-profile').innerHTML = `
        <div class="container mx-auto px-6">
            <div class="md:flex justify-between items-start mb-12">
                <div>
                    <h1 class="text-4xl md:text-5xl font-extrabold">${team.name || organization.name}</h1>
                    <p class="text-xl text-gray-500">${organization.name} - ${team.city}, ${team.state} | ${team.ageLevel} ${team.division}</p>
                </div>
                <div class="text-center mt-6 md:mt-0">
                    <div class="text-6xl font-bold text-blue-600">${avgOverall}</div>
                    <div class="star-rating text-2xl">${starsHtml}</div>
                    <p class="text-gray-600">Based on ${reviewCount} reviews</p>
                </div>
            </div>

            <div class="grid lg:grid-cols-3 gap-12">
                <div class="lg:col-span-1">
                    <h3 class="text-2xl font-bold mb-6">Detailed Ratings</h3>
                    <div class="space-y-5">${ratingsHtml}</div>
                </div>
                <div class="lg:col-span-2">
                    <h3 class="text-2xl font-bold mb-6">Parent & Player Reviews</h3>
                    <div class="space-y-8">${reviewsHtml}</div>
                </div>
            </div>
        </div>
    `;
}


function renderRatingRow(label, value, color) {
    return `
        <div>
            <div class="flex justify-between mb-1">
                <span class="font-semibold">${label}</span>
                <span class="font-bold">${value}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div class="${color} h-2.5 rounded-full" style="width: ${value * 20}%"></div>
            </div>
        </div>
    `;
}


function renderStars(score) {
    let stars = '';
    const full = Math.floor(score);
    const half = score % 1 >= 0.5;
    for (let i = 0; i < full; i++) stars += '<i class="fas fa-star"></i>';
    if (half) stars += '<i class="fas fa-star-half-alt"></i>';
    for (let i = stars.match(/fa-star/g)?.length || 0; i < 5; i++) stars += '<i class="far fa-star"></i>';
    return stars;
}
