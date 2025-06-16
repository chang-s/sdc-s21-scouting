document.addEventListener("DOMContentLoaded", () => {
    const roster = document.getElementById("roster");
    const checkboxContainer = document.getElementById("checkboxContainer");
    const generateBtn = document.getElementById("generateBtn");
    const teamFilter = document.getElementById("teamFilter");
    const searchInput = document.getElementById("searchInput");
    let playerData = [];

    async function fetchPlayers() {
        const response = await fetch("players.json");
        playerData = await response.json();
        renderPlayerCards();
        renderPlayerButtons();
        updateGenerateBtnState();
    }

    function renderPlayerCards() {
        roster.innerHTML = "";
        playerData.forEach(player => {
            const card = document.createElement("div");
            card.className = "player-card rounded-lg shadow-md p-4 bg-white transition border-2 border-transparent cursor-pointer";
            card.dataset.name = player.name;

            const tierColor = {
                1: "bg-red-200",
                2: "bg-orange-200",
                3: "bg-blue-200",
                4: "bg-green-200"
            }[player.tier];

            const rolesHtml = player.roles.map(role => `<img src="${roleIcons[role]}" class="w-6 h-6" />`).join(" ");

            const champStatsHtml = player.champStats.map(cs =>
                `<tr><td>${cs.champion}</td><td>${cs.games}</td><td>${cs.kda}</td><td>${cs.winRate}</td></tr>`
            ).join("");

            const gameStatsHtml = player.gameStats.map((g, i) =>
                `<tr><td>${i + 1}</td><td>${g.champion}</td><td>${g.k}</td><td>${g.d}</td><td>${g.a}</td><td><span class="${g.result === 'W' ? 'text-green-600' : 'text-red-600'} font-semibold">${g.result}</span></td><td title="${g.vs}">${g.vsAbbr}</td></tr>`
            ).join("");

            const champsPlayedSummary = player.champsPlayed.map(cp => `<tr><td>${cp.champ}</td><td>${cp.games} games</td></tr>`).join("");

            let kdaColor = "text-gray-500";
            if (player.avgKDA >= 6) kdaColor = "text-red-500";
            else if (player.avgKDA >= 5) kdaColor = "text-yellow-500";
            else if (player.avgKDA >= 4) kdaColor = "text-green-500";
            else if (player.avgKDA >= 3) kdaColor = "text-blue-500";

            const rankIcon = rankIcons[player.rank] || "";

            card.innerHTML = `
                <div class="relative">
                    <a href="${player.opgg}" target="_blank" class="absolute top-2 right-2" title="View op.gg profile">
                        <img src="https://i.imgur.com/y0la7LC.png" alt="op.gg" class="w-6 h-6 opacity-70 hover:opacity-100 hover:scale-110 transition-transform duration-200" />
                    </a>

                    <div class="flex items-center mb-2">
                        <h2 class="text-xl font-bold flex items-center gap-2">
                            <span class="text-sm font-semibold px-2 py-1 rounded ${tierColor}">T${player.tier}</span>
                            ${player.name}
                            ${rolesHtml}
                        </h2>
                    </div>

                    <div class="mb-2">
                        <div class="inline-block mb-1 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full shadow-sm">
                            ${player.team}
                        </div><br />
                    </div>

                    <p><strong>Tier:</strong> Tier ${player.tier} (${player.points} pts)</p>
                    <p><strong>Rank:</strong> ${rankIcon ? `<img src="${rankIcon}" class="w-6 inline ml-1" />` : ""} ${player.rank}</p>
                    <p><strong>Roles:</strong> ${player.roles.join(", ")}</p>
                    <p><strong>Top Champions:</strong> ${player.topChampions.join(", ")}</p>

                    <button onclick="toggleStats(this, 'champ')" class="mt-2 text-sm text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded transition">Show Champ Stats ▼</button>
                    <div class="hidden mt-2 text-sm bg-gray-50 p-2 rounded champ-stats">
                        <table class="table-auto w-full text-left">
                            <thead><tr><th>Champion</th><th>Games</th><th>KDA</th><th>Win%</th></tr></thead>
                            <tbody>${champStatsHtml}</tbody>
                        </table>
                    </div>

                    <button onclick="toggleStats(this, 'game')" class="mt-2 text-sm text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded transition">Show Game Stats ▼</button>
                    <div class="hidden mt-2 text-sm bg-gray-50 p-2 rounded game-stats">
                        <table class="table-auto w-full text-left">
                            <thead><tr><th>Game</th><th>Champion</th><th>K</th><th>D</th><th>A</th><th>Result</th><th>vs Team</th></tr></thead>
                            <tbody>${gameStatsHtml}</tbody>
                        </table>
                        <div class="mt-4">
                            <h4 class="font-semibold mb-1">Champs Played</h4>
                            <table class="table-auto w-full text-left mb-2">
                                <tbody>${champsPlayedSummary}</tbody>
                            </table>
                            <p class="font-semibold">Avg KDA: <span class="${kdaColor}">${player.avgKDA}</span></p>
                        </div>
                    </div>
                </div>
            `;

            // Click event to sync with pill
            card.addEventListener("click", () => {
                const pill = document.querySelector(`.player-pill[data-name="${player.name}"]`);
                card.classList.toggle("selected-card");

                if (pill) {
                    pill.classList.toggle("selected-pill");
                    pill.classList.toggle("bg-purple-500");
                    pill.classList.toggle("text-white");
                    pill.classList.toggle("border-gray-300");
                    pill.classList.toggle("border-purple-500");
                    pill.innerHTML = pill.classList.contains("selected-pill") ? `✅ ${player.name}` : player.name;
                }

                updateGenerateBtnState();
            });

            roster.appendChild(card);
        });
    }

    function renderPlayerButtons() {
        const selectedTeam = teamFilter.value;
        checkboxContainer.innerHTML = "";

        if (selectedTeam === "All") return;

        playerData
        .filter(player => player.team === selectedTeam)
        .forEach(player => {
            const btn = document.createElement("button");
            btn.dataset.name = player.name;
            btn.className = "player-pill px-4 py-1 rounded-full text-sm font-semibold transition border border-gray-300 hover:bg-purple-100 hover:text-purple-800 mb-1 mr-2";
            btn.innerHTML = player.name;

            btn.addEventListener("click", () => {
                btn.classList.toggle("selected-pill");
                btn.classList.toggle("bg-purple-500");
                btn.classList.toggle("text-white");
                btn.classList.toggle("border-gray-300");
                btn.classList.toggle("border-purple-500");

                btn.innerHTML = btn.classList.contains("selected-pill") ? `✅ ${player.name}` : player.name;

                const card = document.querySelector(`.player-card[data-name="${player.name}"]`);
                if (card) {
                    card.classList.toggle("selected-card");
                }

                updateGenerateBtnState();
            });

            checkboxContainer.appendChild(btn);
        });
    }

    function toggleStats(button, type) {
        const statDiv = button.nextElementSibling;
        const isHidden = statDiv.classList.contains("hidden");
        statDiv.classList.toggle("hidden");
        button.textContent = isHidden ? `Hide ${type === 'champ' ? 'Champ' : 'Game'} Stats ▲` : `Show ${type === 'champ' ? 'Champ' : 'Game'} Stats ▼`;
    }

    function updateGenerateBtnState() {
        const selected = Array.from(checkboxContainer.querySelectorAll(".selected-pill"));
        generateBtn.disabled = selected.length === 0;
        generateBtn.classList.toggle("cursor-not-allowed", selected.length === 0);
    }

    generateBtn.addEventListener("click", () => {
        const selected = Array.from(document.querySelectorAll(".selected-pill")).map(el => el.dataset.name);
        if (selected.length === 0) return;
        const encodedNames = selected.map(name => encodeURIComponent(name)).join(",");
        window.open(`https://op.gg/lol/multisearch/na?summoners=${encodedNames}`, "_blank");
    });

    teamFilter.addEventListener("change", () => {
        renderPlayerButtons();
        renderPlayerCards();
    });

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        document.querySelectorAll(".player-card").forEach(card => {
            const name = card.dataset.name.toLowerCase();
            card.style.display = name.includes(query) ? "block" : "none";
        });
    });

    fetchPlayers();

    const roleIcons = {
        "Top": "https://wiki.leagueoflegends.com/en-us/images/thumb/Top_icon.png/120px-Top_icon.png",
        "Jungle": "https://wiki.leagueoflegends.com/en-us/images/thumb/Jungle_icon.png/120px-Jungle_icon.png",
        "Mid": "https://wiki.leagueoflegends.com/en-us/images/thumb/Middle_icon.png/120px-Middle_icon.png",
        "Bot": "https://wiki.leagueoflegends.com/en-us/images/thumb/Bottom_icon.png/120px-Bottom_icon.png",
        "Support": "https://wiki.leagueoflegends.com/en-us/images/thumb/Support_icon.png/120px-Support_icon.png"
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
});