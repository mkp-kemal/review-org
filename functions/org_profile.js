function getJwtFromCookie() {
    const match = document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHtml = '';

    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHtml += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && hasHalfStar) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        } else {
            starsHtml += '<i class="far fa-star"></i>';
        }
    }

    return starsHtml;
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function getSeasonDisplay(term, year) {
    const seasonMap = {
        'SPRING': 'Spring',
        'SUMMER': 'Summer',
        'FALL': 'Fall',
        'WINTER': 'Winter'
    };
    return `${seasonMap[term] || term} ${year}`;
}

function showAdminButtons(roles, teamData) {
    const adminButtons = document.getElementById('admin-buttons');
    if (!adminButtons) return;

    const isSiteAdmin = roles.role.includes('SITE_ADMIN');
    const isOrgAdmin = roles.role.includes('ORG_ADMIN');
    const isTeamAdmin = roles.role.includes('TEAM_ADMIN');

    if (isSiteAdmin || isOrgAdmin || isTeamAdmin) {
        adminButtons.style.display = 'block';

        
        document.getElementById('edit-team-btn').style.display =
            (isSiteAdmin || isOrgAdmin || isTeamAdmin) ? 'block' : 'none';

        document.getElementById('delete-team-btn').style.display =
            (isSiteAdmin || isOrgAdmin) ? 'block' : 'none';

        document.getElementById('add-review-btn').style.display =
            (isSiteAdmin || isOrgAdmin || isTeamAdmin) ? 'block' : 'none';

        document.getElementById('respond-review-btn').style.display =
            (isSiteAdmin || isOrgAdmin || isTeamAdmin) ? 'block' : 'none';

        document.getElementById('manage-members-btn').style.display =
            (isSiteAdmin || isOrgAdmin || isTeamAdmin) ? 'block' : 'none';
    }
}


function showRespondModal(reviewId, teamId, currentResponse = '') {
    Swal.fire({
        title: 'Respond to Review',
        input: 'textarea',
        inputValue: currentResponse,
        inputPlaceholder: 'Type your response here...',
        showCancelButton: true,
        confirmButtonText: 'Submit Response',
        showLoaderOnConfirm: true,
        preConfirm: (response) => {
            if (!response) {
                Swal.showValidationMessage('Response cannot be empty');
                return false;
            }

            
            const url = currentResponse
                ? `${window.APP_CONFIG.API_URL}/teams/${reviewId}/respond`
                : `${window.APP_CONFIG.API_URL}/reviews/${reviewId}/respond`;

            const method = currentResponse ? 'PATCH' : 'POST';

            return fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getJwtFromCookie()}`
                },
                body: JSON.stringify({ body: response })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(response.statusText);
                    }
                    return response.json();
                })
                .catch(error => {
                    Swal.showValidationMessage(`Request failed: ${error}`);
                });
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Success!',
                text: 'Response submitted successfully',
                icon: 'success'
            }).then(() => {
                
                location.reload();
            });
        }
    });
}


function toggleReviewVisibility(reviewId, isCurrentlyPublic) {
    const newStatus = !isCurrentlyPublic;

    Swal.fire({
        title: 'Are you sure?',
        text: `This will ${newStatus ? 'show' : 'hide'} this review from public view`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: `Yes, ${newStatus ? 'show' : 'hide'} it!`,
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`${window.APP_CONFIG.API_URL}/teams/${reviewId}/reviews/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getJwtFromCookie()}`
                },
                body: JSON.stringify({ isPublic: newStatus })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to update review status');
                    }
                    return response.json();
                })
                .then(data => {
                    Swal.fire(
                        'Updated!',
                        `Review has been ${newStatus ? 'shown' : 'hidden'}.`,
                        'success'
                    ).then(() => {
                        
                        location.reload();
                    });
                })
                .catch(error => {
                    Swal.fire(
                        'Error!',
                        'Failed to update review status.',
                        'error'
                    );
                });
        }
    });
}


function deleteResponse(respondId) {
    

    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`${window.APP_CONFIG.API_URL}/respond/${respondId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getJwtFromCookie()}`
                },
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to delete response');
                    }
                    return response.json();
                })
                .then(data => {
                    Swal.fire(
                        'Deleted!',
                        'Response has been deleted.',
                        'success'
                    ).then(() => {
                        
                        location.reload();
                    });
                })
                .catch(error => {
                    Swal.fire(
                        'Error!',
                        'Failed to delete response.',
                        'error'
                    );
                });
        }
    });
}

function flagReview(reviewId) {
    Swal.fire({
        title: 'Report Review',
        input: 'textarea',
        inputPlaceholder: 'Type your reason report here...',
        showCancelButton: true,
        confirmButtonText: 'Submit Report',
        showLoaderOnConfirm: true,
        preConfirm: async (response) => {
            if (!response) {
                Swal.showValidationMessage('Reason cannot be empty');
                return false;
            }

            const flagData = { reason: response };

            const url = `${window.APP_CONFIG.API_URL}/reviews/${reviewId}/flag`;
            const method = 'POST';
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

            if (!isLoggedIn) flagData.userId = getOrCreateUserId();

            const auth = await checkCredentials();
            if (!auth.isAuthenticated) flagData.userId = getOrCreateUserId();

            return fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getJwtFromCookie()}`
                },
                body: JSON.stringify(flagData)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(response.statusText);
                    }
                    return response.json();
                })
                .catch(error => {
                    Swal.showValidationMessage(`Request failed: ${error}`);
                });
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Success!',
                text: 'Report submitted successfully, admin will review your report.',
                icon: 'success'
            }).then(() => {
                location.reload();
            });
        }
    });
}

async function checkCredentials() {
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

function getOrCreateUserId() {
    let userId = localStorage.getItem("userId");
    if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem("userId", userId);
    }
    return userId;
}

async function loadOrgProfile() {
    
    const params = new URLSearchParams(window.location.search);
    const orgId = params.get('id');
    if (!orgId) {
        console.error('No organization ID in URL');
        return;
    }

    try {
        const res = await fetch(`${window.APP_CONFIG.API_URL}/teams/${orgId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getJwtFromCookie()}`
            }
        });

        if (!res.ok) throw new Error(`Failed to fetch organization data: ${res.status}`);

        const data = await res.json();
        

        const storedUser = window.user

        
        document.getElementById('org-name').textContent = data.name || 'Unknown Team';
        document.getElementById('org-location').innerHTML = `<i class="fas fa-map-marker-alt mr-2"></i>${data.city || 'Unknown'}, ${data.state || 'Unknown'}`;

        
        const tagsContainer = document.getElementById('team-tags');
        if (data.ageLevel) {
            const tag = document.createElement('span');
            tag.className = 'bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded';
            tag.textContent = data.ageLevel;
            tagsContainer.appendChild(tag);
        }
        if (data.division) {
            const tag = document.createElement('span');
            tag.className = 'bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded';
            tag.textContent = data.division;
            tagsContainer.appendChild(tag);
        }

        if (window.user) {
            if (!data?.claimedById && !data?.organization?.claimedById) {
                const claimButton = document.getElementById('claim-btn');
                claimButton.className = 'mt-4 cursor-pointer bg-blue-600 text-white font-semibold py-2 px-4 rounded'
                claimButton.textContent = `Claim ${data?.organization?.name}`;

                claimButton.addEventListener('click', async () => {
                    const email = window?.user?.email || '';
                    const domain = email.split('@')[1];

                    
                    let orgDomain = data.organization?.website || '';

                    try {
                        
                        if (!orgDomain.startsWith('http')) {
                            orgDomain = 'http://' + orgDomain;
                        }
                        const parsed = new URL(orgDomain);
                        orgDomain = parsed.hostname.replace(/^www\./, ''); 
                    } catch (e) {
                        orgDomain = orgDomain.replace(/^https?:\/\//, '')  
                            .replace(/^www\./, '');     
                    }

                    if (domain !== orgDomain) {
                        Swal.fire({
                            title: 'Error!',
                            text: `Your email domain (${domain}) is not the same as the organization's website domain (${orgDomain}).`,
                            icon: 'error',
                            confirmButtonColor: '#ef4444',
                            confirmButtonText: 'OK'
                        });
                    } else {
                        Swal.fire({
                            title: 'Warning!',
                            text: `You are about to claim this organization. Are you sure?`,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#3085d6',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Yes, I am sure!'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                claimOrganization(data.organization.id);
                            }
                        });
                    }
                })
            }
        }


        
        const accum = data.accumulation || {};
        document.getElementById('overall-rating').textContent = accum.overall?.toFixed(1) || '0.0';
        document.getElementById('star-rating').innerHTML = renderStars(accum.overall || 0);

        
        const ratingFields = [
            { id: 'coaching', value: accum.coaching },
            { id: 'development', value: accum.development },
            { id: 'transparency', value: accum.transparency },
            { id: 'culture', value: accum.culture },
            { id: 'safety', value: accum.safety }
        ];

        ratingFields.forEach(field => {
            const value = field.value || 0;
            const percentage = (value / 5) * 100;

            document.getElementById(`${field.id}-rating`).textContent = value.toFixed(1);
            document.getElementById(`${field.id}-bar`).style.width = `${percentage}%`;
        });

        
        const reviewCount = data.reviews?.length || 0;
        document.getElementById('review-count').textContent = `Based on ${reviewCount} reviews`;
        document.getElementById('reviews-title').textContent = `Parent & Player Reviews (${reviewCount})`;

        
        document.getElementById('about-org-name').textContent = data.name || 'Organization';

        const aboutContent = document.getElementById('about-content');
        aboutContent.innerHTML = `
                <p>Welcome to ${data.name || 'this team'}, located in ${data.city || 'Unknown'}, ${data.state || 'Unknown'}.</p>
                ${data.organization?.website ? `<p>Website: <a href="https://${data.organization.website}" target="_blank" class="text-blue-600 hover:underline">${data.organization.website}</a></p>` : ''}
                <p>This team competes in ${data.ageLevel || 'unknown age level'} and plays in the ${data.division || 'unknown division'}.</p>
            `;

        
        const reviewsContainer = document.getElementById('reviews-container');
        reviewsContainer.innerHTML = ''; 

        //Team Photos
        const teamPhotosContainer = document.getElementById("teamPhotos");
        teamPhotosContainer.innerHTML = "";

        data.teamPhoto.forEach(photo => {
            const img = document.createElement("img");
            img.src = photo.filename;
            img.alt = "Team Photo";
            img.className = "rounded-lg";
            img.onerror = function () {
                this.src = "https://placehold.co/400x300/808080/FFFFFF?text=Not%20Load";
            };
            teamPhotosContainer.appendChild(img);
        });

        
        if (data.teamPhoto.length === 0) {
            teamPhotosContainer.innerHTML = `
      <img src="https://placehold.co/400x300/1E40AF/FFFFFF?text=No+Photo" 
           alt="Placeholder" 
           class="rounded-lg">
    `;
        }

        if (data.reviews && data.reviews.length > 0) {
            data.reviews.forEach(review => {
                const reviewDiv = document.createElement('div');
                reviewDiv.className = 'p-6 border rounded-lg';

                const rating = review.rating?.overall || 0;
                const starsHtml = renderStars(rating);
                const reviewer = review.user?.email ? review.user.email.split('@')[0] : 'Anonymous';
                const seasonDisplay = getSeasonDisplay(review.season_term, review.season_year);
                const hasResponse = !!review.orgResponse;

                reviewDiv.innerHTML = `
                        <div class="flex justify-between items-center mb-3">
                            <h4 class="text-lg font-bold">${review.title || 'No title'} ${window?.user?.email === review?.user?.email ? '(You)' : ""}</h4>
                            <div class="star-rating">${starsHtml}</div>
                        </div>
                        <p style="display:none" class="reviewer-name text-gray-700 mb-2"><b>By:</b> ${reviewer}</p>
                        <p class="text-gray-700 mb-2">${review.body || 'No review content'}</p>
                        <p class="text-sm text-gray-500">Season: ${seasonDisplay} | Reviewed: ${formatDate(review.createdAt)}</p>
                    `;

                
                if (hasResponse) {
                    const responseDiv = document.createElement('div');
                    responseDiv.className = 'mt-4 p-4 bg-gray-50 rounded-lg border-t';

                    let responseFrom = '';
                    switch (review.orgResponse.user.role) {
                        case 'TEAM_ADMIN':
                            responseFrom = 'Team';
                            break;
                        case 'SITE_ADMIN':
                            responseFrom = 'Admin';
                            break;
                        case 'ORG_ADMIN':
                            responseFrom = 'Organization';
                            break;
                        default:
                            responseFrom = 'Unknown';
                    }

                    responseDiv.innerHTML = `
                                <h5 class="text-md font-bold text-gray-800 mb-2">
                                    <i class="fas fa-building mr-2"></i>Response from ${responseFrom}
                                </h5>
                                <p class="text-gray-600">${review.orgResponse.body}</p>
                                <p class="text-xs text-gray-500 mt-2">Responded on ${formatDate(review.orgResponse.createdAt)}</p>
                            `;
                    reviewDiv.appendChild(responseDiv);
                }

                
                const isSiteAdmin = storedUser?.role?.includes('SITE_ADMIN');
                const isRelatedUser = (data.claimedById == window?.user?.id || data.organization?.claimedById == window?.user?.id);
                const isNotBasicPlan = data.subscription?.plan !== 'BASIC';

                if (storedUser && (isSiteAdmin || (isRelatedUser && isNotBasicPlan))) {
                    const adminActions = document.createElement('div');
                    adminActions.className = 'mt-3 flex justify-end space-x-2';

                    
                    adminActions.innerHTML = `
        <button class="hide-review-btn bg-gray-100 text-gray-800 text-sm font-semibold py-1 px-3 rounded hover:bg-gray-200">
            <i class="fas ${review.isPublic ? 'fa-eye-slash' : 'fa-eye'} mr-1"></i>${review.isPublic ? 'Hide' : 'Unhide'}
        </button>
    `;

                    
                    if (hasResponse) {
                        adminActions.innerHTML += `
            <button class="edit-response-btn bg-blue-100 text-blue-800 text-sm font-semibold py-1 px-3 rounded hover:bg-blue-200">
                <i class="fas fa-edit mr-1"></i>Edit
            </button>
            <button class="delete-response-btn bg-red-100 text-red-800 text-sm font-semibold py-1 px-3 rounded hover:bg-red-200">
                <i class="fas fa-trash mr-1"></i>Delete
            </button>
        `;
                    } else {
                        
                        adminActions.innerHTML += `
            <button class="respond-review-btn bg-purple-100 text-purple-800 text-sm font-semibold py-1 px-3 rounded hover:bg-purple-200">
                <i class="fas fa-reply mr-1"></i>Respond
            </button>
        `;
                    }

                    reviewDiv.appendChild(adminActions);

                    
                    adminActions.querySelector('.hide-review-btn')?.addEventListener('click', () => {
                        toggleReviewVisibility(review.id, review.isPublic);
                    });

                    if (hasResponse) {
                        adminActions.querySelector('.edit-response-btn')?.addEventListener('click', () => {
                            showRespondModal(review.id, orgId, review.orgResponse.body);
                        });

                        adminActions.querySelector('.delete-response-btn')?.addEventListener('click', () => {
                            deleteResponse(review.orgResponse.id);
                        });
                    } else {
                        adminActions.querySelector('.respond-review-btn')?.addEventListener('click', () => {
                            showRespondModal(review.id, orgId);
                        });
                    }
                } else {
                    
                    const currentUserId = window?.user?.id || localStorage.getItem("userId");

                    
                    if (window?.user?.email !== review?.user?.email) {
                        const alreadyFlagged = review.flags?.some(f => f.reporterUserId === currentUserId);

                        if (!alreadyFlagged) {
                            const flagsDiv = document.createElement('div');
                            flagsDiv.className = 'flex justify-end space-x-2 mt-3';
                            flagsDiv.innerHTML = `
                <button class="flag-review-btn bg-gray-100 text-gray-800 text-sm font-semibold py-1 px-3 rounded hover:bg-gray-200">
                    <i class="fas fa-flag mr-1"></i>Flag
                </button>
            `;
                            reviewDiv.appendChild(flagsDiv);

                            flagsDiv.querySelector('.flag-review-btn')?.addEventListener('click', () => {
                                flagReview(review.id);
                            });
                        }
                    }
                }


                reviewsContainer.appendChild(reviewDiv);

                if (storedUser) {
                    showAdminButtons(storedUser, data);

                    if (storedUser.role.includes('SITE_ADMIN', 'ORG_ADMIN', 'TEAM_ADMIN')) {
                        document.querySelectorAll('.reviewer-name').forEach(el => {
                            el.style.display = 'block';
                        });
                    }
                }
            });
        } else {
            reviewsContainer.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-info-circle text-4xl text-gray-400 mb-2"></i>
                        <p class="text-gray-500">No reviews yet for this team.</p>
                    </div>
                `;
        }

    } catch (err) {
        console.error('Error loading organization profile:', err);

        
        const reviewsContainer = document.getElementById('reviews-container');
        reviewsContainer.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-2"></i>
                    <p class="text-red-500">Failed to load team data. Please try again later.</p>
                </div>
            `;
    }
}

async function claimOrganization(organizationId) {
    try {
        const res = await fetch(`${window.APP_CONFIG.API_URL}/orgs/${organizationId}/claim`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getCookie('accessToken')}`,
            },
        });
        const data = await res.json();

        if (res.ok) {
            const swalPopup = swal.fire({
                title: 'Success',
                text: 'Organization claimed successfully',
                icon: 'success',
                showConfirmButton: true,
                allowOutsideClick: false,
            });
            await swalPopup.then((result) => {
                if (result.isConfirmed) {
                    logout();
                }
            });
        } else {
            swal.fire('Error', data.message || 'Failed to claim organization', 'error');
        }
    } catch (err) {
        swal.fire('Error', err.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    let user = await checkCredentials();

    window.user = user.user;
});

document.addEventListener('DOMContentLoaded', loadOrgProfile);