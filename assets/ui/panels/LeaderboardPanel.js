// Simple LeaderboardPanel implementation with tutorial styling and overlay
window.LeaderboardPanel = {
    panel: null,
    isInitialized: false,
    allLeaderboardData: [],
    currentFishType: 'all',
    currentSortBy: 'weight', // 'weight' or 'value'
    
    initialize: function() {
        console.log("[LEADERBOARD] Initializing simple leaderboard");
        
        // Create panel if it doesn't exist
        if (!this.panel) {
            this.panel = document.createElement('div');
            this.panel.id = 'leaderboard-ui';
            this.panel.innerHTML = `
                <div id="leaderboard-overlay">
                    <div class="leaderboard-container">
                        <div class="panel-header">
                            <h2>Fishing Leaderboard</h2>
                            <div class="close-button" id="leaderboard-close-button">×</div>
                        </div>
                        <div class="panel-controls">
                            <div class="filter-container">
                                <label for="fish-type-filter">Fish Type:</label>
                                <select id="fish-type-filter" class="filter-dropdown">
                                    <option value="all">All Fish Types</option>
                                    <!-- Fish types will be populated dynamically -->
                                </select>
                            </div>
                            <div class="sort-container">
                                <label>Sort By:</label>
                                <div class="sort-buttons">
                                    <button id="sort-by-weight" class="sort-button active">Weight</button>
                                    <button id="sort-by-value" class="sort-button">Value</button>
                                </div>
                            </div>
                        </div>
                        <div class="panel-content">
                            <table class="leaderboard-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Player</th>
                                        <th>Fish Type</th>
                                        <th>Weight</th>
                                        <th>Value</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Leaderboard entries will go here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(this.panel);
            
            // Add event listeners
            this.panel.querySelector('#leaderboard-close-button').addEventListener('click', () => {
                this.hide();
            });
            
            // Fish type filter
            this.panel.querySelector('#fish-type-filter').addEventListener('change', (e) => {
                this.currentFishType = e.target.value;
                this.updateLeaderboardDisplay();
                hytopia.sendData({ type: 'disablePlayerInput' });
            });
            
            // Sort buttons
            this.panel.querySelector('#sort-by-weight').addEventListener('click', () => {
                
                this.setSortBy('weight');
                hytopia.sendData({ type: 'disablePlayerInput' });
            });
            
            this.panel.querySelector('#sort-by-value').addEventListener('click', () => {
                this.setSortBy('value');
                hytopia.sendData({ type: 'disablePlayerInput' });
            });
            
            // Add event listener for L key
            document.addEventListener('keydown', (event) => {
                if (event.key.toLowerCase() === 'l') {
                    console.log("[LEADERBOARD] L key pressed");
                    this.toggle();
                    
                    // Request leaderboard data when showing
                    if (this.isShowing()) {
                        this.requestLeaderboardData();
                    }
                } else if (event.key === 'Escape' && this.isShowing()) {
                    this.hide();
                }
            });
            
            // Set up data listener
            hytopia.onData((data) => {            
                if (data.type === 'leaderboardUpdate') {
                     console.log("[LEADERBOARD] Received data:", data);
                    console.log("[LEADERBOARD] Processing leaderboard update");
                    this.processLeaderboardUpdate(data);
                }
            });
            
            // Add styles with tutorial-like appearance
            const style = document.createElement('style');
            style.textContent = `
                #leaderboard-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.7);
                    z-index: 2000;
                    display: none;
                    justify-content: center;
                    align-items: center;
                }
                
                .leaderboard-container {
                    width: 600px;
                    background-color: #1a2633;
                    border: 2px solid #4a90e2;
                    border-radius: 8px;
                    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
                    max-height: 80vh;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                
                .panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 20px;
                    background: #0a1622;
                    border-bottom: 1px solid #4a90e2;
                }
                
                .panel-header h2 {
                    margin: 0;
                    color: #ffffff;
                    font-size: 22px;
                }
                
                .close-button {
                    font-size: 24px;
                    color: #ffffff;
                    cursor: pointer;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background-color 0.2s;
                }
                
                .close-button:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }
                
                .panel-controls {
                    display: flex;
                    justify-content: space-between;
                    margin: 15px;
                    padding: 10px;
                    background-color: #0d1a26;
                    border-radius: 4px;
                    border: 1px solid #2a3b4d;
                }
                
                .filter-container, .sort-container {
                    display: flex;
                    align-items: center;
                }
                
                .filter-container label, .sort-container label {
                    color: #d0d0d0;
                    margin-right: 10px;
                }
                
                .filter-dropdown {
                    background-color: #1a2633;
                    color: #d0d0d0;
                    border: 1px solid #2a3b4d;
                    padding: 5px 10px;
                    border-radius: 4px;
                }
                
                .sort-buttons {
                    display: flex;
                    margin-left: 10px;
                }
                
                .sort-button {
                    padding: 5px 10px;
                    background-color: #1a2633;
                    border: 1px solid #2a3b4d;
                    color: #d0d0d0;
                    cursor: pointer;
                }
                
                .sort-button:first-child {
                    border-radius: 3px 0 0 3px;
                }
                
                .sort-button:last-child {
                    border-radius: 0 3px 3px 0;
                }
                
                .sort-button.active {
                    background-color: #4a90e2;
                    color: white;
                    border-color: #4a90e2;
                }
                
                .panel-content {
                    padding: 0 15px 15px 15px;
                    overflow-y: auto;
                    max-height: 50vh;
                }
                
                .leaderboard-table {
                    width: 100%;
                    border-collapse: collapse;
                    color: #d0d0d0;
                }
                
                .leaderboard-table th, .leaderboard-table td {
                    padding: 10px;
                    text-align: left;
                    border-bottom: 1px solid #2a3b4d;
                }
                
                .leaderboard-table th {
                    background-color: #0a1622;
                    color: #ffffff;
                    font-weight: bold;
                    position: sticky;
                    top: 0;
                }
                
                .leaderboard-table tr:hover {
                    background-color: #0d1a26;
                }
                
                /* Fish rarity colors */
                .fish-common {
                    color: #d0d0d0;
                }
                
                .fish-uncommon {
                    color: #4a90e2;
                }
                
                .fish-rare {
                    color: #9b59b6;
                }
                
                .fish-epic {
                    color: #f1c40f;
                }
                
                .fish-legendary {
                    color: #e74c3c;
                }
                
                /* Custom scrollbar */
                .panel-content::-webkit-scrollbar {
                    width: 8px;
                }
                
                .panel-content::-webkit-scrollbar-track {
                    background: #0d1a26;
                    border-radius: 4px;
                }
                
                .panel-content::-webkit-scrollbar-thumb {
                    background: #2a3b4d;
                    border-radius: 4px;
                }
                
                .panel-content::-webkit-scrollbar-thumb:hover {
                    background: #4a90e2;
                }
                
                /* Empty state */
                .empty-state {
                    text-align: center;
                    padding: 30px;
                    color: #6c7a89;
                }
            `;
            document.head.appendChild(style);
            
            this.isInitialized = true;
            console.log("[LEADERBOARD] Initialization complete");
        }
    },
    
    setSortBy: function(sortBy) {
        if (this.currentSortBy === sortBy) return;
        
        this.currentSortBy = sortBy;
        
        // Update button states
        const weightButton = this.panel.querySelector('#sort-by-weight');
        const valueButton = this.panel.querySelector('#sort-by-value');
        
        if (sortBy === 'weight') {
            weightButton.classList.add('active');
            valueButton.classList.remove('active');
        } else {
            weightButton.classList.remove('active');
            valueButton.classList.add('active');
        }
        
        this.updateLeaderboardDisplay();
    },
    
    requestLeaderboardData: function() {
        console.log("[LEADERBOARD] Requesting leaderboard data");
        hytopia.sendData({ type: 'requestLeaderboard' });
    },
    
    processLeaderboardUpdate: function(data) {
        console.log("[LEADERBOARD] Processing leaderboard update:", data);
        
        if (data.allLeaderboards) {
            // Process all leaderboards
            const allEntries = [];
            
            for (const [species, leaderboard] of Object.entries(data.allLeaderboards)) {
                if (leaderboard) {
                    // Process weight leaderboard
                    if (leaderboard.byWeight) {
                        leaderboard.byWeight.forEach(entry => {
                            allEntries.push({
                                ...entry,
                                fishType: species
                            });
                        });
                    }
                    
                    // Process value leaderboard if not already included
                    if (leaderboard.byValue) {
                        leaderboard.byValue.forEach(entry => {
                            // Check if this entry is already in the list (from byWeight)
                            const isDuplicate = allEntries.some(e => 
                                e.playerId === entry.playerId && 
                                e.timestamp === entry.timestamp && 
                                e.fishType === species
                            );
                            
                            if (!isDuplicate) {
                                allEntries.push({
                                    ...entry,
                                    fishType: species
                                });
                            }
                        });
                    }
                }
            }
            
            this.allLeaderboardData = allEntries;
            this.updateFishTypeDropdown();
            this.updateLeaderboardDisplay();
        } else if (data.species && data.leaderboard) {
            // Process single species leaderboard
            const entries = [];
            
            // Process weight leaderboard
            if (data.leaderboard.byWeight) {
                data.leaderboard.byWeight.forEach(entry => {
                    entries.push({
                        ...entry,
                        fishType: data.species
                    });
                });
            }
            
            // Process value leaderboard if not already included
            if (data.leaderboard.byValue) {
                data.leaderboard.byValue.forEach(entry => {
                    // Check if this entry is already in the list (from byWeight)
                    const isDuplicate = entries.some(e => 
                        e.playerId === entry.playerId && 
                        e.timestamp === entry.timestamp
                    );
                    
                    if (!isDuplicate) {
                        entries.push({
                            ...entry,
                            fishType: data.species
                        });
                    }
                });
            }
            
            this.allLeaderboardData = entries;
            this.updateFishTypeDropdown();
            this.updateLeaderboardDisplay();
        }
    },
    
    updateFishTypeDropdown: function() {
        // Get unique fish types
        const fishTypes = ['all'];
        this.allLeaderboardData.forEach(entry => {
            if (!fishTypes.includes(entry.fishType)) {
                fishTypes.push(entry.fishType);
            }
        });
        
        // Sort alphabetically (except 'all' stays first)
        fishTypes.sort((a, b) => {
            if (a === 'all') return -1;
            if (b === 'all') return 1;
            return a.localeCompare(b);
        });
        
        // Update dropdown
        const dropdown = this.panel.querySelector('#fish-type-filter');
        const currentValue = dropdown.value;
        
        dropdown.innerHTML = '';
        fishTypes.forEach(fishType => {
            const option = document.createElement('option');
            option.value = fishType;
            option.textContent = fishType === 'all' ? 'All Fish Types' : fishType;
            dropdown.appendChild(option);
        });
        
        // Restore selected value if it still exists
        if (fishTypes.includes(currentValue)) {
            dropdown.value = currentValue;
        } else {
            dropdown.value = 'all';
            this.currentFishType = 'all';
        }
    },
    
    updateLeaderboardDisplay: function() {
        console.log("[LEADERBOARD] Updating display with", this.allLeaderboardData.length, "entries");
        
        if (!this.isInitialized) {
            this.initialize();
        }
        
        const tbody = this.panel.querySelector('tbody');
        if (!tbody) {
            console.error("[LEADERBOARD] Could not find tbody element");
            return;
        }
        
        tbody.innerHTML = '';
        
        // Filter by fish type
        let filteredData = [...this.allLeaderboardData];
        if (this.currentFishType !== 'all') {
            filteredData = filteredData.filter(entry => entry.fishType === this.currentFishType);
        }
        
        // Sort by selected criteria
        if (this.currentSortBy === 'weight') {
            filteredData.sort((a, b) => b.weight - a.weight);
        } else {
            filteredData.sort((a, b) => b.value - a.value);
        }
        
        // Check if we have data to display
        if (filteredData.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="6" class="empty-state">
                    <p>No leaderboard entries found</p>
                    <p>Catch some fish to see your name here!</p>
                </td>
            `;
            tbody.appendChild(emptyRow);
            return;
        }
        
        // Create table rows
        filteredData.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            // Determine fish rarity class (this is just an example, adjust based on your game's logic)
            let rarityClass = '';
            if (entry.rarity) {
                rarityClass = `fish-${entry.rarity.toLowerCase()}`;
            }
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.playerName || 'Unknown'}</td>
                <td class="${rarityClass}">${entry.fishType || 'Unknown'}</td>
                <td>${entry.weight ? entry.weight.toFixed(2) : '0.00'} lbs</td>
                <td>$${entry.value || 0}</td>
                <td>${entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : 'Unknown'}</td>
            `;
            tbody.appendChild(row);
        });
        
        console.log("[LEADERBOARD] Added", filteredData.length, "rows to the table");
    },
    
    isShowing: function() {
        return this.panel && 
               this.panel.querySelector('#leaderboard-overlay') && 
               this.panel.querySelector('#leaderboard-overlay').style.display === 'flex';
    },
    
    show: function() {
        console.log("[LEADERBOARD] Showing panel");
        if (!this.isInitialized) {
            this.initialize();
        }
        
        const overlay = this.panel.querySelector('#leaderboard-overlay');
        overlay.style.display = 'flex';
        
        // Disable player controls while leaderboard is open
        hytopia.sendData({
            type: 'disablePlayerInput'
        });
        
        this.requestLeaderboardData();
    },
    
    hide: function() {
        console.log("[LEADERBOARD] Hiding panel");
        if (this.panel) {
            const overlay = this.panel.querySelector('#leaderboard-overlay');
            overlay.style.display = 'none';
            
            // Re-enable player controls
            hytopia.sendData({
                type: 'enablePlayerInput'
            });
        }
    },
    
    toggle: function() {
        console.log("[LEADERBOARD] Toggling panel");
        if (!this.isInitialized) {
            this.initialize();
        }
        
        if (this.isShowing()) {
            this.hide();
        } else {
            this.show();
        }
    }
};

// Initialize the leaderboard
window.LeaderboardPanel.initialize();

console.log("[LEADERBOARD] Module loaded");