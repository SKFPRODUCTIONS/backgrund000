// Import Firebase configuration
import { storage, STORAGE_PATH, getPublicUrl, gamesRef } from './firebase-config.js';

// Constants
const ITEMS_PER_PAGE = 20;

// Admin credentials
const ADMIN_CREDENTIALS = {
    username: 'SKF',
    password: '753'
};

// DOM Elements
const adminLoginBtn = document.getElementById('adminLoginBtn');
const loginModal = document.getElementById('loginModal');
const adminPanel = document.getElementById('adminPanel');
const loginForm = document.getElementById('loginForm');
const addGameForm = document.getElementById('addGameForm');
const logoutBtn = document.getElementById('logoutBtn');
const gameGrid = document.getElementById('gameGrid');
const gamesList = document.getElementById('gamesList');
const gameIconInput = document.getElementById('gameIcon');
const iconPreview = document.getElementById('iconPreview');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const currentPageSpan = document.getElementById('currentPage');
const totalPagesSpan = document.getElementById('totalPages');
const loadingIndicator = document.getElementById('loadingIndicator');
const gameCategorySelect = document.getElementById('gameCategory');
const gameSubCategorySelect = document.getElementById('gameSubCategory');

// State management
let games = [];
let currentPage = 1;
let searchQuery = '';
let currentCategory = 'all';
let isLoading = false;

// Initialize filter buttons
const filterBtns = document.querySelectorAll('.filter-btn');
const gamesCategories = document.querySelector('.games-categories');
const appsCategories = document.querySelector('.apps-categories');

// Initial game data
// Default game icons as base64 encoded SVGs
const defaultIcons = {
    game: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#4a90e2"/><text x="50" y="50" font-size="60" fill="white" text-anchor="middle" dy=".35em">🎮</text></svg>')}`,
    app: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2ecc71"/><text x="50" y="50" font-size="60" fill="white" text-anchor="middle" dy=".35em">📱</text></svg>')}`
};

const defaultGames = [
    // Games
    {
        id: 1,
        name: 'Spiderman 2 Part 1',
        description: 'Spider-Man 2 Part One is an action-adventure game where you step into Peter Parker\'s shoes, balancing college life with the thrill of being New York\'s agile, web-slinging hero',
        icon: defaultIcons.game,
        downloadLink: 'https://example.com/spiderman2',
        dateAdded: new Date().getTime(),
        category: 'games',
        subCategory: 'action-games'
    },
    {
        id: 2,
        name: 'GTA 6',
        description: 'Experience the next evolution of the Grand Theft Auto series with stunning graphics and an immersive open world',
        icon: defaultIcons.game,
        downloadLink: 'https://example.com/gta6',
        dateAdded: new Date().getTime(),
        category: 'games',
        subCategory: 'open-world'
    },
    {
        id: 3,
        name: 'Call of Duty Modern Warfare III',
        description: 'The latest installment in the Call of Duty franchise featuring intense multiplayer combat and a gripping campaign',
        icon: defaultIcons.game,
        downloadLink: 'https://example.com/codmw3',
        dateAdded: new Date().getTime(),
        category: 'games',
        subCategory: 'fps-games'
    },
    // Apps
    {
        id: 4,
        name: 'Photoshop 2024',
        description: 'Professional photo editing software with advanced AI features and creative tools',
        icon: defaultIcons.app,
        downloadLink: 'https://example.com/photoshop2024',
        dateAdded: new Date().getTime(),
        category: 'apps',
        subCategory: 'art-design'
    },
    {
        id: 5,
        name: 'Visual Studio Code',
        description: 'Powerful code editor with extensive plugin support and integrated development features',
        icon: defaultIcons.app,
        downloadLink: 'https://example.com/vscode',
        dateAdded: new Date().getTime(),
        category: 'apps',
        subCategory: 'development'
    },
    {
        id: 6,
        name: 'OBS Studio',
        description: 'Professional streaming and recording software with advanced features',
        icon: defaultIcons.app,
        downloadLink: 'https://example.com/obs',
        dateAdded: new Date().getTime(),
        category: 'apps',
        subCategory: 'video-editing'
    },
    {
        id: 7,
        name: 'Spotify',
        description: 'Stream millions of songs and podcasts with personalized recommendations',
        icon: defaultIcons.app,
        downloadLink: 'https://example.com/spotify',
        dateAdded: new Date().getTime(),
        category: 'apps',
        subCategory: 'entertainment'
    }
];

// Utility Functions
const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
};

const validateImageFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload an image file.');
    }
    if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size too large. Maximum size is 5MB.');
    }
    return true;
};

const optimizeImage = async (file) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxSize = 300;
            let width = img.width;
            let height = img.height;
            
            if (width > height && width > maxSize) {
                height *= maxSize / width;
                width = maxSize;
            } else if (height > maxSize) {
                width *= maxSize / height;
                height = maxSize;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(async (blob) => {
                try {
                    // Create a unique filename with timestamp and original name
                    const timestamp = Date.now();
                    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
                    const filename = `${timestamp}_${safeFileName}`;
                    const fullPath = `${STORAGE_PATH}${filename}`;
                    const storageRef = storage.ref(fullPath);
                    
                    // Set metadata for public access
                    const metadata = {
                        contentType: 'image/webp',
                        cacheControl: 'public, max-age=31536000',
                    };
                    
                    // Upload the optimized image blob with metadata
                    const uploadTask = await storageRef.put(blob, metadata);
                    
                    // Get the public URL using our helper
                    const publicUrl = getPublicUrl(fullPath);
                    resolve(publicUrl);
                } catch (error) {
                    console.error('Error uploading image:', error);
                    reject(error);
                }
            }, 'image/webp', 0.8);
        };
        
        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };
        
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
        };
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
    });
};

// Filter button click handlers
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const category = btn.dataset.category;
        
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (category === 'games') {
            gamesCategories.classList.add('active');
            appsCategories.classList.remove('active');
        } else if (category === 'apps') {
            appsCategories.classList.add('active');
            gamesCategories.classList.remove('active');
        } else {
            gamesCategories.classList.remove('active');
            appsCategories.classList.remove('active');
        }
        
        currentCategory = category;
        currentPage = 1;
        renderGames();
    });
});

// Load games from Firebase with real-time updates
const loadGames = () => {
    try {
        console.log('Setting up real-time games listener...');
        
        // Set up real-time listener for games
        gamesRef.on('value', (snapshot) => {
            const data = snapshot.val();
            
            if (data) {
                console.log('Received real-time update');
                // Convert object to array and validate
                const gamesArray = Object.values(data);
                const validGames = gamesArray.filter(item =>
                    item &&
                    item.id &&
                    item.name &&
                    item.description &&
                    item.icon &&
                    item.downloadLink &&
                    item.category &&
                    item.subCategory
                );
                
                if (validGames.length > 0) {
                    games = validGames;
                } else {
                    initializeDefaultGames();
                }
            } else {
                console.log('No data in Firebase, initializing defaults');
                initializeDefaultGames();
            }
            
            // Ensure proper date format and sort
            games = games.map(item => ({
                ...item,
                dateAdded: item.dateAdded || new Date().getTime()
            }));
            games.sort((a, b) => b.dateAdded - a.dateAdded);
            
            // Render the updated games
            renderGames();
            if (document.getElementById('gamesList')) {
                renderAdminGamesList();
            }
        });
        
    } catch (error) {
        console.error('Error setting up real-time listener:', error);
        showNotification('Error loading data. Using default items.', 'error');
        initializeDefaultGames();
    }
};

// Initialize default games in Firebase
const initializeDefaultGames = async () => {
    try {
        games = defaultGames;
        const gamesObject = {};
        defaultGames.forEach(game => {
            gamesObject[game.id] = game;
        });
        await gamesRef.set(gamesObject);
    } catch (error) {
        console.error('Error initializing default games:', error);
        showNotification('Error initializing default games', 'error');
    }
};

// Helper functions
const generateId = () => Math.max(...games.map(g => g.id), 0) + 1;

const setLoading = (loading) => {
    isLoading = loading;
    loadingIndicator.classList.toggle('active', loading);
    document.body.style.cursor = loading ? 'wait' : 'default';
};

const filterGames = () => {
    let filtered = [...games];
    console.log('Starting filter with', filtered.length, 'items');
    console.log('Current category:', currentCategory);
    
    // Apply search filter if query exists
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(item =>
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        );
        console.log('After search filter:', filtered.length, 'items');
    }
    
    // Apply category filter
    if (currentCategory !== 'all') {
        if (currentCategory === 'games' || currentCategory === 'apps') {
            // Main category filter (games or apps)
            filtered = filtered.filter(item => item.category === currentCategory);
        } else {
            // Get the main category from the subcategory
            const mainCategory = currentCategory.includes('-') ?
                currentCategory.split('-')[0] : // For subcategories like 'action-games'
                currentCategory; // For direct categories
            
            // Filter by main category and subcategory if applicable
            filtered = filtered.filter(item => {
                const isMainCategoryMatch = item.category === mainCategory;
                const isSubCategoryMatch = item.subCategory === currentCategory;
                
                // If it's a subcategory (contains '-'), match exactly
                if (currentCategory.includes('-')) {
                    return isSubCategoryMatch;
                }
                // Otherwise, show all items from the main category
                return isMainCategoryMatch;
            });
        }
        console.log('After category filter:', filtered.length, 'items');
    }
    
    // Sort items: first by category type, then by date
    filtered.sort((a, b) => {
        // First sort by category (games first, then apps)
        if (a.category !== b.category) {
            return a.category === 'games' ? -1 : 1;
        }
        // Then by date added, newest first
        return b.dateAdded - a.dateAdded;
    });
    
    console.log('Final filtered and sorted items:', filtered.length);
    return filtered;
};

const updatePagination = (totalItems) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    currentPage = Math.min(currentPage, totalPages);
    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages;
    
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
};

const renderGames = async () => {
    try {
        setLoading(true);
        console.log('Starting renderGames...');
        console.log('Current games array:', games);
        
        const filteredGames = filterGames();
        console.log('Filtered games:', filteredGames);
        
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const paginatedGames = filteredGames.slice(startIndex, endIndex);
        console.log('Paginated games:', paginatedGames);

        if (paginatedGames.length === 0) {
            gameGrid.innerHTML = `
                <div class="no-games-message">
                    <i class="fas fa-info-circle"></i>
                    <p>No games or apps found. Try a different category or search term.</p>
                </div>
            `;
        } else {
            gameGrid.innerHTML = paginatedGames.map(game => {
                const fallbackIcon = game.category === 'apps' ? defaultIcons.app : defaultIcons.game;
                return `
                    <article class="game-card" itemscope itemtype="https://schema.org/${game.category === 'games' ? 'VideoGame' : 'SoftwareApplication'}">
                        <img src="${sanitizeHTML(game.icon)}"
                             alt="${sanitizeHTML(game.name)} icon"
                             class="game-icon"
                             itemprop="image"
                             onerror="this.src='${fallbackIcon}'">
                        <span class="game-category-tag">${game.category === 'games' ? '🎮' : '📱'} ${sanitizeHTML(game.subCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))}</span>
                        <h2 itemprop="name">${sanitizeHTML(game.name)}</h2>
                        <p itemprop="description">${sanitizeHTML(game.description)}</p>
                        <div class="game-meta">
                            <span class="category-info">Category: ${sanitizeHTML(game.subCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))}</span>
                            <span class="date-info">Added: ${new Date(game.dateAdded).toLocaleDateString()}</span>
                        </div>
                        <a href="${sanitizeHTML(game.downloadLink)}"
                           class="download-btn"
                           target="_blank"
                           rel="noopener noreferrer"
                           itemprop="downloadUrl">
                            <i class="fas fa-download"></i> Download Now
                        </a>
                    </article>
                `;
            }).join('');
        }

        updatePagination(filteredGames.length);
        console.log('Games rendered successfully');
    } catch (error) {
        console.error('Error rendering games:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            games: games,
            currentCategory: currentCategory,
            searchQuery: searchQuery
        });
        showNotification('Error displaying games', 'error');
        gameGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>There was an error loading the games. Please try again.</p>
            </div>
        `;
    } finally {
        setLoading(false);
    }
};

// HTML sanitization utility
const sanitizeHTML = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

const renderAdminGamesList = () => {
    try {
        // Add admin controls
        const adminControls = `
            <div class="admin-controls">
                <div class="admin-filters">
                    <select id="adminCategoryFilter" aria-label="Filter by category">
                        <option value="all">All Items</option>
                        <option value="games">Games Only</option>
                        <option value="apps">Apps Only</option>
                    </select>
                    <input type="text" id="adminSearchInput" placeholder="Search items..." aria-label="Search items">
                </div>
                <div class="admin-sort">
                    <select id="adminSortOrder" aria-label="Sort items">
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="name">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                    </select>
                </div>
            </div>
        `;

        // Sort and filter games
        let filteredGames = [...games];
        const categoryFilter = document.getElementById('adminCategoryFilter')?.value || 'all';
        const searchQuery = document.getElementById('adminSearchInput')?.value?.toLowerCase() || '';
        const sortOrder = document.getElementById('adminSortOrder')?.value || 'newest';

        if (categoryFilter !== 'all') {
            filteredGames = filteredGames.filter(game => game.category === categoryFilter);
        }

        if (searchQuery) {
            filteredGames = filteredGames.filter(game =>
                game.name.toLowerCase().includes(searchQuery) ||
                game.description.toLowerCase().includes(searchQuery)
            );
        }

        // Sort games
        filteredGames.sort((a, b) => {
            switch (sortOrder) {
                case 'newest':
                    return b.dateAdded - a.dateAdded;
                case 'oldest':
                    return a.dateAdded - b.dateAdded;
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                default:
                    return 0;
            }
        });

        // Render the list
        gamesList.innerHTML = adminControls + filteredGames.map(game => {
            const fallbackIcon = game.category === 'apps' ? defaultIcons.app : defaultIcons.game;
            const dateAdded = new Date(game.dateAdded).toLocaleDateString();
            return `
                <div class="admin-game-item" data-id="${game.id}">
                    <div class="game-info">
                        <img src="${sanitizeHTML(game.icon)}"
                             alt="${sanitizeHTML(game.name)}"
                             class="game-icon"
                             style="width: 40px; height: 40px;"
                             onerror="this.src='${fallbackIcon}'">
                        <div class="game-details">
                            <span class="game-name">${sanitizeHTML(game.name)}</span>
                            <span class="game-category">${game.category === 'games' ? '🎮' : '📱'} ${sanitizeHTML(game.subCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))}</span>
                            <span class="game-date">Added: ${dateAdded}</span>
                        </div>
                    </div>
                    <div class="game-actions">
                        <button onclick="editGame(${parseInt(game.id)})" class="edit-btn" title="Edit item">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="deleteGame(${parseInt(game.id)})" class="delete-btn" title="Delete item">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners for admin controls
        const adminCategoryFilter = document.getElementById('adminCategoryFilter');
        const adminSearchInput = document.getElementById('adminSearchInput');
        const adminSortOrder = document.getElementById('adminSortOrder');

        if (adminCategoryFilter && adminSearchInput && adminSortOrder) {
            adminCategoryFilter.addEventListener('change', renderAdminGamesList);
            adminSearchInput.addEventListener('input', renderAdminGamesList);
            adminSortOrder.addEventListener('change', renderAdminGamesList);
        }
    } catch (error) {
        console.error('Error rendering admin games list:', error);
        showNotification('Error displaying admin games list', 'error');
    }
};

const saveGames = async () => {
    try {
        // Validate games array before saving
        if (!Array.isArray(games)) {
            throw new Error('Invalid games data structure');
        }

        // Ensure all required fields are present
        const validGames = games.filter(item =>
            item &&
            item.id &&
            item.name &&
            item.description &&
            item.icon &&
            item.downloadLink &&
            item.category &&
            item.subCategory
        );

        if (validGames.length === 0) {
            throw new Error('No valid games data to save');
        }

        // Sort by date before saving
        validGames.sort((a, b) => b.dateAdded - a.dateAdded);

        // Convert array to object with IDs as keys for Firebase
        const gamesObject = {};
        validGames.forEach(game => {
            gamesObject[game.id] = game;
        });

        // Save to Firebase Realtime Database
        await gamesRef.set(gamesObject);
        
        // Update the games array with validated data
        games = validGames;
        
        showNotification('Changes saved successfully', 'success');
        console.log('Games saved successfully:', games);
    } catch (error) {
        console.error('Error saving games:', error);
        showNotification('Error saving changes. Please try again.', 'error');
        throw error; // Re-throw to handle in calling function
    }
};

// Category selection handler
gameCategorySelect.addEventListener('change', () => {
    const selectedCategory = gameCategorySelect.value;
    const gamesOptions = gameSubCategorySelect.querySelector('.games-options');
    const appsOptions = gameSubCategorySelect.querySelector('.apps-options');
    
    if (selectedCategory === 'games') {
        gamesOptions.style.display = 'block';
        appsOptions.style.display = 'none';
        gameSubCategorySelect.value = gamesOptions.querySelector('option').value;
    } else {
        gamesOptions.style.display = 'none';
        appsOptions.style.display = 'block';
        gameSubCategorySelect.value = appsOptions.querySelector('option').value;
    }
});

// Event Listeners
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    currentPage = 1;
    renderGames();
});

searchBtn.addEventListener('click', () => {
    currentPage = 1;
    renderGames();
});

prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderGames();
    }
});

nextPageBtn.addEventListener('click', () => {
    const totalItems = filterGames().length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (currentPage < totalPages) {
        currentPage++;
        renderGames();
    }
});

gameIconInput.addEventListener('change', async (e) => {
    try {
        const file = e.target.files[0];
        if (!file) return;

        validateImageFile(file);
        const optimizedDataUrl = await optimizeImage(file);
        
        const img = document.createElement('img');
        img.src = optimizedDataUrl;
        iconPreview.innerHTML = '';
        iconPreview.appendChild(img);
    } catch (error) {
        console.error('Error handling image:', error);
        showNotification(error.message, 'error');
        e.target.value = '';
        iconPreview.innerHTML = '';
    }
});

adminLoginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            loginModal.style.display = 'none';
            adminPanel.style.display = 'block';
            loginForm.reset();
            renderAdminGamesList();
            showNotification('Login successful', 'success');
        } else {
            showNotification('Invalid credentials', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed', 'error');
    } finally {
        setLoading(false);
    }
});

logoutBtn.addEventListener('click', () => {
    adminPanel.style.display = 'none';
    showNotification('Logged out successfully', 'success');
});

addGameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        const fileInput = document.getElementById('gameIcon');
        const file = fileInput.files[0];
        
        if (!file) {
            throw new Error('Please select an icon image');
        }

        validateImageFile(file);
        const optimizedDataUrl = await optimizeImage(file);

        const newGame = {
            id: generateId(),
            name: document.getElementById('gameName').value,
            description: document.getElementById('gameDescription').value,
            icon: optimizedDataUrl,
            downloadLink: document.getElementById('downloadLink').value,
            dateAdded: new Date().getTime(),
            category: document.getElementById('gameCategory').value,
            subCategory: document.getElementById('gameSubCategory').value
        };

        games.push(newGame);
        saveGames();
        addGameForm.reset();
        iconPreview.innerHTML = '';
        showNotification('Game added successfully', 'success');
    } catch (error) {
        console.error('Error adding game:', error);
        showNotification(error.message, 'error');
    } finally {
        setLoading(false);
    }
});

window.deleteGame = async (id) => {
    try {
        if (confirm('Are you sure you want to delete this game?')) {
            setLoading(true);
            
            // Find the game to get its icon URL
            const game = games.find(g => g.id === id);
            if (game && game.icon && game.icon.includes(firebaseConfig.storageBucket)) {
                try {
                    // Extract filename from Firebase Storage URL
                    const iconUrl = new URL(game.icon);
                    const pathname = decodeURIComponent(iconUrl.pathname);
                    const filename = pathname.split('/o/')[1].split('?')[0];
                    
                    // Delete the image from Firebase Storage
                    await storage.ref(filename).delete();
                } catch (error) {
                    console.error('Error deleting image from storage:', error);
                    // Continue with game deletion even if image deletion fails
                }
            }
            
            games = games.filter(game => game.id !== id);
            await saveGames();
            showNotification('Game deleted successfully', 'success');
        }
    } catch (error) {
        console.error('Error deleting game:', error);
        showNotification('Error deleting game', 'error');
    } finally {
        setLoading(false);
    }
};

window.editGame = (id) => {
    const game = games.find(g => g.id === id);
    if (!game) {
        showNotification('Game not found', 'error');
        return;
    }

    const editModal = document.createElement('div');
    editModal.className = 'modal';
    editModal.style.display = 'block';
    
    editModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit ${game.category === 'games' ? 'Game' : 'App'}</h2>
                <button type="button" class="close-btn" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="editGameForm">
                <div class="form-group">
                    <label for="editGameName">Name</label>
                    <input type="text" id="editGameName" value="${game.name}" required
                           placeholder="Enter name of game or app">
                </div>
                <div class="form-group">
                    <label for="editGameDescription">Description</label>
                    <textarea id="editGameDescription" required>${game.description}</textarea>
                </div>
                <div class="form-group">
                    <label for="editGameIcon">Game Icon</label>
                    <input type="file" id="editGameIcon" accept="image/*">
                    <div class="icon-preview" id="editIconPreview">
                        <img src="${game.icon}" alt="${game.name}"
                             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2270%22>🎮</text></svg>'">
                    </div>
                </div>
                <div class="form-group">
                    <label for="editGameCategory">Category</label>
                    <select id="editGameCategory" required>
                        <option value="games" ${game.category === 'games' ? 'selected' : ''}>Games</option>
                        <option value="apps" ${game.category === 'apps' ? 'selected' : ''}>Apps</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editGameSubCategory">Sub Category</label>
                    <select id="editGameSubCategory" required>
                        <optgroup label="Games" class="games-options" style="display: ${game.category === 'games' ? 'block' : 'none'}">
                            <option value="action-games" ${game.subCategory === 'action-games' ? 'selected' : ''}>Action Games</option>
                            <option value="adventure-games" ${game.subCategory === 'adventure-games' ? 'selected' : ''}>Adventure Games</option>
                            <option value="arcade-games" ${game.subCategory === 'arcade-games' ? 'selected' : ''}>Arcade Games</option>
                            <option value="battle-royale" ${game.subCategory === 'battle-royale' ? 'selected' : ''}>Battle Royale</option>
                            <option value="car-games" ${game.subCategory === 'car-games' ? 'selected' : ''}>Car & Racing Games</option>
                            <option value="card-games" ${game.subCategory === 'card-games' ? 'selected' : ''}>Card Games</option>
                            <option value="fighting-games" ${game.subCategory === 'fighting-games' ? 'selected' : ''}>Fighting Games</option>
                            <option value="fps-games" ${game.subCategory === 'fps-games' ? 'selected' : ''}>FPS Games</option>
                            <option value="horror-games" ${game.subCategory === 'horror-games' ? 'selected' : ''}>Horror Games</option>
                            <option value="indie-games" ${game.subCategory === 'indie-games' ? 'selected' : ''}>Indie Games</option>
                            <option value="mmorpg" ${game.subCategory === 'mmorpg' ? 'selected' : ''}>MMORPG</option>
                            <option value="moba-games" ${game.subCategory === 'moba-games' ? 'selected' : ''}>MOBA Games</option>
                            <option value="open-world" ${game.subCategory === 'open-world' ? 'selected' : ''}>Open World Games</option>
                            <option value="platform-games" ${game.subCategory === 'platform-games' ? 'selected' : ''}>Platform Games</option>
                            <option value="puzzle-games" ${game.subCategory === 'puzzle-games' ? 'selected' : ''}>Puzzle Games</option>
                            <option value="rpg-games" ${game.subCategory === 'rpg-games' ? 'selected' : ''}>RPG Games</option>
                            <option value="simulation" ${game.subCategory === 'simulation' ? 'selected' : ''}>Simulation Games</option>
                            <option value="sports-games" ${game.subCategory === 'sports-games' ? 'selected' : ''}>Sports Games</option>
                            <option value="strategy-games" ${game.subCategory === 'strategy-games' ? 'selected' : ''}>Strategy Games</option>
                            <option value="survival-games" ${game.subCategory === 'survival-games' ? 'selected' : ''}>Survival Games</option>
                        </optgroup>
                        <optgroup label="Apps" class="apps-options" style="display: ${game.category === 'apps' ? 'block' : 'none'}">
                            <option value="antivirus" ${game.subCategory === 'antivirus' ? 'selected' : ''}>Antivirus & Security</option>
                            <option value="art-design" ${game.subCategory === 'art-design' ? 'selected' : ''}>Art & Design</option>
                            <option value="audio-music" ${game.subCategory === 'audio-music' ? 'selected' : ''}>Audio & Music</option>
                            <option value="business" ${game.subCategory === 'business' ? 'selected' : ''}>Business & Office</option>
                            <option value="communication" ${game.subCategory === 'communication' ? 'selected' : ''}>Communication</option>
                            <option value="development" ${game.subCategory === 'development' ? 'selected' : ''}>Development Tools</option>
                            <option value="educational" ${game.subCategory === 'educational' ? 'selected' : ''}>Educational</option>
                            <option value="entertainment" ${game.subCategory === 'entertainment' ? 'selected' : ''}>Entertainment</option>
                            <option value="file-management" ${game.subCategory === 'file-management' ? 'selected' : ''}>File Management</option>
                            <option value="lifestyle" ${game.subCategory === 'lifestyle' ? 'selected' : ''}>Lifestyle</option>
                            <option value="multimedia" ${game.subCategory === 'multimedia' ? 'selected' : ''}>Multimedia</option>
                            <option value="networking" ${game.subCategory === 'networking' ? 'selected' : ''}>Networking</option>
                            <option value="productivity" ${game.subCategory === 'productivity' ? 'selected' : ''}>Productivity</option>
                            <option value="social" ${game.subCategory === 'social' ? 'selected' : ''}>Social Media</option>
                            <option value="system-tools" ${game.subCategory === 'system-tools' ? 'selected' : ''}>System Tools</option>
                            <option value="utilities" ${game.subCategory === 'utilities' ? 'selected' : ''}>Utilities</option>
                            <option value="video-editing" ${game.subCategory === 'video-editing' ? 'selected' : ''}>Video Editing</option>
                            <option value="web-browsers" ${game.subCategory === 'web-browsers' ? 'selected' : ''}>Web Browsers</option>
                        </optgroup>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editDownloadLink">Download Link</label>
                    <input type="url" id="editDownloadLink" value="${game.downloadLink}" required>
                </div>
                <div class="form-actions">
                    <button type="submit">Save Changes</button>
                    <button type="button" onclick="this.closest('.modal').remove()" class="cancel-btn">Cancel</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(editModal);

    const editIconInput = document.getElementById('editGameIcon');
    const editIconPreview = document.getElementById('editIconPreview');
    const editGameCategory = document.getElementById('editGameCategory');
    const editGameSubCategory = document.getElementById('editGameSubCategory');
    
    // Category change handler for edit form
    editGameCategory.addEventListener('change', () => {
        const selectedCategory = editGameCategory.value;
        const gamesOptions = editGameSubCategory.querySelector('.games-options');
        const appsOptions = editGameSubCategory.querySelector('.apps-options');
        
        if (selectedCategory === 'games') {
            gamesOptions.style.display = 'block';
            appsOptions.style.display = 'none';
            editGameSubCategory.value = gamesOptions.querySelector('option').value;
        } else {
            gamesOptions.style.display = 'none';
            appsOptions.style.display = 'block';
            editGameSubCategory.value = appsOptions.querySelector('option').value;
        }
    });
    
    editIconInput.addEventListener('change', async (e) => {
        try {
            const file = e.target.files[0];
            if (!file) return;

            validateImageFile(file);
            const optimizedDataUrl = await optimizeImage(file);
            
            const img = document.createElement('img');
            img.src = optimizedDataUrl;
            editIconPreview.innerHTML = '';
            editIconPreview.appendChild(img);
        } catch (error) {
            console.error('Error handling image:', error);
            showNotification(error.message, 'error');
            e.target.value = '';
        }
    });

    const editGameForm = document.getElementById('editGameForm');
    editGameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let iconDataUrl = game.icon;
            const fileInput = document.getElementById('editGameIcon');
            
            if (fileInput.files.length > 0) {
                validateImageFile(fileInput.files[0]);
                
                // Delete old image from Firebase Storage if it exists
                if (game.icon && game.icon.includes(firebaseConfig.storageBucket)) {
                    try {
                        const oldIconUrl = new URL(game.icon);
                        const oldPathname = decodeURIComponent(oldIconUrl.pathname);
                        const oldFilename = oldPathname.split('/o/')[1].split('?')[0];
                        await storage.ref(oldFilename).delete();
                    } catch (error) {
                        console.error('Error deleting old image from storage:', error);
                        // Continue with update even if old image deletion fails
                    }
                }
                
                // Upload new image
                iconDataUrl = await optimizeImage(fileInput.files[0]);
            }

            games = games.map(g => g.id === id ? {
                ...g,
                name: document.getElementById('editGameName').value,
                description: document.getElementById('editGameDescription').value,
                icon: iconDataUrl,
                downloadLink: document.getElementById('editDownloadLink').value,
                category: document.getElementById('editGameCategory').value,
                subCategory: document.getElementById('editGameSubCategory').value
            } : g);

            await saveGames();
            editModal.remove();
            showNotification('Game updated successfully', 'success');
        } catch (error) {
            console.error('Error updating game:', error);
            showNotification(error.message, 'error');
        } finally {
            setLoading(false);
        }
    });
};

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing app...');
    
    try {
        setLoading(true);
        
        // Start with default games
        games = defaultGames;
        
        // Try to load games from Firebase, but don't block on failure
        try {
            await loadGames();
        } catch (error) {
            console.log('Could not load from Firebase, using default games');
            // Continue with default games
        }

        // Set initial category to 'all' to show everything
        currentCategory = 'all';

        // Initialize filter buttons
        filterBtns.forEach(btn => {
            const category = btn.dataset.category;
            btn.addEventListener('click', () => {
                console.log('Filter clicked:', category);
                
                // Update active states
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show/hide subcategories
                if (category === 'games') {
                    gamesCategories.classList.add('active');
                    appsCategories.classList.remove('active');
                } else if (category === 'apps') {
                    appsCategories.classList.add('active');
                    gamesCategories.classList.remove('active');
                } else {
                    gamesCategories.classList.remove('active');
                    appsCategories.classList.remove('active');
                }
                
                currentCategory = category;
                currentPage = 1;
                renderGames();
            });
        });

        // Initialize search with debouncing
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                console.log('Search input:', searchInput.value);
                searchQuery = searchInput.value;
                currentPage = 1;
                renderGames();
            }, 300);
        });

        // Initial render
        console.log('Starting initial render...');
        renderGames();
        console.log('Initial render complete');
        
        // Initialize admin panel controls if they exist
        const adminCategoryFilter = document.getElementById('adminCategoryFilter');
        const adminSearchInput = document.getElementById('adminSearchInput');
        const adminSortOrder = document.getElementById('adminSortOrder');

        if (adminCategoryFilter && adminSearchInput && adminSortOrder) {
            adminCategoryFilter.addEventListener('change', renderAdminGamesList);
            adminSearchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(renderAdminGamesList, 300);
            });
            adminSortOrder.addEventListener('change', renderAdminGamesList);
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        showNotification('Error initializing the app', 'error');
    } finally {
        setLoading(false);
    }
});