document.addEventListener("DOMContentLoaded", () => {
    // --- PASSWORD PROTECTION GATE ---
    const correctPassword = "cupcake123";
    const gate = document.getElementById("passwordGate");
    const input = document.getElementById("passwordInput");
    const submit = document.getElementById("submitPassword");
    const error = document.getElementById("errorMessage");
    const siteContent = document.querySelector("body > .max-w-6xl");

    siteContent.classList.add("opacity-0");

    submit.addEventListener("click", () => {
        if (input.value === correctPassword) {
            gate.classList.add("opacity-0", "pointer-events-none", "transition", "duration-700");
            setTimeout(() => {
                gate.style.display = "none";
                siteContent.classList.remove("opacity-0");
                siteContent.classList.add("fade-in");
            }, 700);
        } else {
            error.classList.remove("hidden");
            input.classList.add("border-red-400");
        }
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") submit.click();
    });

    // --- MAIN CONTENT ---
    const roster = document.getElementById("roster");
    const checkboxContainer = document.getElementById("checkboxContainer");
    const generateBtn = document.getElementById("generateBtn");
    const showCardsBtn = document.getElementById("showCardsBtn");
    const teamFilter = document.getElementById("teamFilter");
    const searchInput = document.getElementById("searchInput");

    let playerData = [];                 // All player data
    let showingSelectedOnly = false;    // Flag for toggling cards

    // Fetch data and render initial state
    async function fetchPlayers() {
        const response = await fetch("players.json");
        playerData = await response.json();
        renderPlayerCards();
        renderPlayerButtons();
        updateGenerateBtnState();
    }

    // Render all player cards (entire roster, full detail)
    function renderPlayerCards() {
        roster.innerHTML = "";
        playerData.forEach(player => {
            const card = document.createElement("div");
            card.className = "player-card rounded-lg shadow-md p-4 bg-white";
            card.dataset.name = player.ign;

            const tierColor = {
                1: "bg-red-200",
                2: "bg-orange-200",
                3: "bg-blue-200",
                4: "bg-green-200"
            }[player.tier];

            const rolesHtml = player.roles.map(role => `<img src="${roleIcons[role]}" class="w-6 h-6" />`).join(" ");

            let kdaColor = "text-gray-500";
            if (player.avgKDA >= 6) kdaColor = "text-red-500";
            else if (player.avgKDA >= 5) kdaColor = "text-yellow-500";
            else if (player.avgKDA >= 4) kdaColor = "text-green-500";
            else if (player.avgKDA >= 3) kdaColor = "text-blue-500";

            const rankIcon = rankIcons[player.rank] || "";

            card.innerHTML = `
                <div class="relative">
                    <!-- Name + Tier + op.gg + Roles -->
                    <div class="flex items-center mb-2 gap-2">
                        <h2 class="text-xl font-bold flex items-center gap-2">
                            <span class="text-sm font-semibold px-2 py-1 rounded ${tierColor}">T${player.tier}</span>
                            ${player.ign}
                        </h2>
                        <a href="${player.opgg}" target="_blank">
                            <img src="https://i.imgur.com/y0la7LC.png" class="w-6 h-6 rounded-full opacity-70 hover:opacity-100 hover:scale-110 transition-transform duration-200" />
                        </a>
                        <div class="flex gap-1">${rolesHtml}</div>
                    </div>

                    <!-- Team Label -->
                    <div class="mb-2">
                        <div class="inline-block mb-1 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full shadow-sm">${player.team}</div><br />
                    </div>

                    <!-- Basic Stats -->
                    <p><strong>Tier:</strong> Tier ${player.tier} (${player.points} pts)</p>
                    <p><strong>Rank:</strong> ${rankIcon ? `<img src="${rankIcon}" class="w-6 inline ml-1" />` : ""} ${player.rank}</p>
                    <p><strong>Roles:</strong> ${player.roles.join(", ")}</p>
                    <p><strong>Top Champions:</strong> ${player.topChamps.join(", ")}</p>
                </div>`;
            roster.appendChild(card);
        });
    }

    // Render pill buttons for the selected team
    function renderPlayerButtons() {
        const selectedTeam = teamFilter.value;
        checkboxContainer.innerHTML = "";
        if (selectedTeam === "All") return;

        playerData
            .filter(player => player.team === selectedTeam)
            .forEach(player => {
                const btn = document.createElement("button");
                btn.dataset.name = player.ign;
                btn.className = "player-pill px-4 py-1 rounded-full text-sm font-semibold transition border border-gray-300 hover:bg-purple-100 hover:text-purple-800 mb-1 mr-2";
                btn.innerHTML = player.ign;

                btn.addEventListener("click", () => {
                    btn.classList.toggle("selected-pill");
                    btn.classList.toggle("bg-purple-500");
                    btn.classList.toggle("text-white");
                    btn.classList.toggle("border-gray-300");
                    btn.classList.toggle("border-purple-500");
                    updateGenerateBtnState();
                    updateCardVisibilityForToggle();
                });

                checkboxContainer.appendChild(btn);
            });
    }

    // Enable/disable the Multi op.gg/show cards buttons
    function updateGenerateBtnState() {
        const selected = document.querySelectorAll(".selected-pill");
        const hasSelection = selected.length > 0;

        // Multi op.gg button
        generateBtn.disabled = !hasSelection;

        // Show Cards button
        showCardsBtn.disabled = !hasSelection;
        showCardsBtn.classList.toggle("opacity-50", !hasSelection);
        showCardsBtn.classList.toggle("cursor-not-allowed", !hasSelection);
    }


    // Show only selected cards if toggled, otherwise show by team
    function updateCardVisibilityForToggle() {
        const selected = Array.from(document.querySelectorAll(".selected-pill")).map(el => el.dataset.name);
        document.querySelectorAll(".player-card").forEach(card => {
            const name = card.dataset.name;
            const player = playerData.find(p => p.ign === name);
            if (showingSelectedOnly) {
                card.style.display = selected.includes(name) ? "block" : "none";
            } else {
                card.style.display = (teamFilter.value === "All" || player.team === teamFilter.value) ? "block" : "none";
            }
        });
    }

    // Clear all pill selections and reset state
    function clearSelections() {
        document.querySelectorAll(".selected-pill").forEach(el =>
            el.classList.remove("selected-pill", "bg-purple-500", "text-white", "border-purple-500")
        );
        showingSelectedOnly = false;
        showCardsBtn.textContent = "Show Selected Cards";
        updateGenerateBtnState();
    }

    // --- BUTTON: Generate Multi op.gg ---
    generateBtn.addEventListener("click", () => {
        const selected = Array.from(document.querySelectorAll(".selected-pill")).map(el => el.dataset.name);
        if (selected.length === 0) return;
        const encodedNames = selected.map(name => encodeURIComponent(name)).join(",");
        const url = `https://op.gg/lol/multisearch/na?summoners=${encodedNames}`;
        window.open(url, "_blank");
    });

    // --- BUTTON: Show Selected Cards Toggle ---
    showCardsBtn.addEventListener("click", () => {
        showingSelectedOnly = !showingSelectedOnly;
        showCardsBtn.textContent = showingSelectedOnly ? "Show All Cards" : "Show Selected Cards";
        updateCardVisibilityForToggle();
    });

    // --- TEAM DROPDOWN: Filter + Reset selections ---
    teamFilter.addEventListener("change", () => {
        clearSelections();
        renderPlayerButtons();
        updateCardVisibilityForToggle();
    });

    // --- SEARCH BAR: Filters visible cards + resets selections ---
    searchInput.addEventListener("input", () => {
        clearSelections();
        const query = searchInput.value.toLowerCase();
        document.querySelectorAll(".player-card").forEach(card => {
            const name = card.dataset.name.toLowerCase();
            card.style.display = name.includes(query) ? "block" : "none";
        });
    });

    // --- ICON MAPPINGS ---
    const roleIcons = {
        "TOP": "https://wiki.leagueoflegends.com/en-us/images/thumb/Top_icon.png/120px-Top_icon.png",
        "JNG": "https://wiki.leagueoflegends.com/en-us/images/thumb/Jungle_icon.png/120px-Jungle_icon.png",
        "MID": "https://wiki.leagueoflegends.com/en-us/images/thumb/Middle_icon.png/120px-Middle_icon.png",
        "BOT": "https://wiki.leagueoflegends.com/en-us/images/thumb/Bottom_icon.png/120px-Bottom_icon.png",
        "SUP": "https://wiki.leagueoflegends.com/en-us/images/thumb/Support_icon.png/120px-Support_icon.png"
    };

    const rankIcons = {
        "Gold": "https://static.wikia.nocookie.net/leagueoflegends/images/7/78/Season_2023_-_Gold.png",
        "Platinum": "https://static.wikia.nocookie.net/leagueoflegends/images/b/bd/Season_2023_-_Platinum.png",
        "Emerald": "https://static.wikia.nocookie.net/leagueoflegends/images/4/4b/Season_2023_-_Emerald.png",
        "Diamond": "https://static.wikia.nocookie.net/leagueoflegends/images/3/37/Season_2023_-_Diamond.png",
        "Master": "https://static.wikia.nocookie.net/leagueoflegends/images/d/d5/Season_2023_-_Master.png",
        "Grandmaster": "https://static.wikia.nocookie.net/leagueoflegends/images/6/64/Season_2023_-_Grandmaster.png",
        "Challenger": "https://static.wikia.nocookie.net/leagueoflegends/images/1/14/Season_2023_-_Challenger.png"
    };

    // --- BOOTSTRAP EVERYTHING ---
    fetchPlayers();
    window.toggleStats = toggleStats;
    updateCheckboxVisibility();
    updateGenerateBtnState();

    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        document.querySelectorAll(".player-card").forEach(card => {
            const name = card.dataset.name.toLowerCase();
            card.style.display = name.includes(query) ? "block" : "none";
        });
    });
});
