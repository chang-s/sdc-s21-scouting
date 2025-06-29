document.addEventListener("DOMContentLoaded", () => {
    // Password protection
    const correctPassword = "cupcake123"; // password
    const gate = document.getElementById("passwordGate");
    const input = document.getElementById("passwordInput");
    const submit = document.getElementById("submitPassword");
    const error = document.getElementById("errorMessage");
    const siteContent = document.querySelector("body > .max-w-6xl");

    siteContent.classList.add("opacity-0"); // hide content until unlocked

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

    // Actual content
    const roster = document.getElementById("roster");
    const checkboxContainer = document.getElementById("checkboxContainer");
    const generateBtn = document.getElementById("generateBtn");
    let playerData = [];

    async function fetchPlayers() {
        const response = await fetch("players.json");
        playerData = await response.json();

        // Sort from highest to lowest by points (parsed as numbers)
        playerData.sort((a, b) => parseInt(b.points || "0") - parseInt(a.points || "0"));

        renderPlayerCards();
        renderPlayerButtons();
        updateGenerateBtnState();
    }

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

            const champStatsHtml = player.champStats.map(cs =>
                `<tr><td>${cs.champion}</td><td>${cs.games}</td><td>${cs.kda}</td><td>${cs.winRate}</td></tr>`
            ).join("");

            const gameStatsHtml = player.gameStats.map((g, i) =>
                `<tr>
                    <td>${g.date}</td>
                    <td>${g.champion}</td>
                    <td>${g.k}</td>
                    <td>${g.d}</td>
                    <td>${g.a}</td>
                    <td class="text-center">
                        <span class="inline-block w-6 h-6 leading-6 text-center rounded-full font-bold text-white 
                            ${g.result?.trim().toLowerCase() === 'win' ? 'bg-green-500' : 'bg-red-500'}">
                            ${g.result?.trim().toLowerCase() === 'win' ? 'W' : 'L'}
                        </span>
                    </td>
                    <td title="${g.vs}">${g.vsAbbr}</td>
                </tr>`
            ).join("");

            const champCounts = player.champsPlayed.reduce((acc, champ) => {
                acc[champ] = (acc[champ] || 0) + 1;
                return acc;
            }, {});

            const champsPlayedSummary = Object.entries(champCounts)
                .map(([champ, count]) => {
                    const iconUrl = `https://ddragon.leagueoflegends.com/cdn/14.12.1/img/champion/${champ}.png`;
                    return `
                    <tr>
                        <td class="flex items-center gap-2">
                            <img src="${iconUrl}" alt="${champ}" class="w-6 h-6 rounded-sm" />
                            ${champ}
                        </td>
                        <td>${count} game${count > 1 ? "s" : ""}</td>
                    </tr>`;
                        })
                .join("");

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
                        <h2 class="text-xl font-bold flex items-start gap-2 leading-tight">
                            <span class="text-sm font-semibold px-2 py-1 rounded ${tierColor}">T${player.tier}</span>
                            <span>
                                ${player.ign.split("#")[0].length > 12
                                            ? `${player.ign.split("#")[0]}<br><span class="text-gray-500 text-sm">#${player.ign.split("#")[1]}</span>`
                                            : `${player.ign.split("#")[0]}<span class="text-gray-500 text-sm">#${player.ign.split("#")[1]}</span>`
                                }
                            </span>
                        </h2>

                        <a href="${player.opgg}" target="_blank" title="View op.gg profile">
                            <img src="https://i.imgur.com/y0la7LC.png" alt="op.gg"
                                class="w-6 h-6 rounded-full opacity-70 hover:opacity-100 hover:scale-110 transition-transform duration-200" />
                        </a>
                        <div class="flex gap-1">
                            ${rolesHtml}
                        </div>
                    </div>

                    <!-- Team + Button -->
                    <div class="mb-2">
                        <div class="inline-block mb-1 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full shadow-sm">
                            ${player.team}
                        </div>
                        <br />
                    </div>

                    <!-- Stats Info -->
                    <p><strong>Tier:</strong> Tier ${player.tier} (${player.points} pts)</p>
                    <p><strong>Rank:</strong> ${rankIcon ? `<img src="${rankIcon}" class="w-6 inline ml-1" />` : ""} ${player.rank}</p>
                    <p><strong>Roles:</strong> ${player.roles.join(", ")}</p>
                    <p><strong>Top Champions:</strong> ${player.topChamps.join(", ")}</p>

                    <!-- Champ Stats -->
                    <button onclick="toggleStats(this, 'champ')" class="mt-2 text-sm text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded transition">Show Champ Stats ▼</button>
                    <div class="hidden mt-2 text-sm bg-gray-50 p-2 rounded champ-stats">
                        <table class="table-auto w-full text-left">
                            <thead><tr><th>Champion</th><th>Games</th><th>KDA</th><th>Win%</th></tr></thead>
                            <tbody>${champStatsHtml}</tbody>
                        </table>
                    </div>

                    <!-- Game Stats -->
                    <button onclick="toggleStats(this, 'game')" class="mt-2 text-sm text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded transition">Show Game Stats ▼</button>
                    <div class="hidden mt-2 text-sm bg-gray-50 p-2 rounded game-stats">
                        <table class="table-auto w-full text-left">
                            <thead><tr><th>Date</th><th>Champion</th><th>K</th><th>D</th><th>A</th><th class="text-center">Result</th><th>vs Team</th></tr></thead>
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
            roster.appendChild(card);
        });
    }

    function renderPlayerButtons() {
        const selectedTeam = document.getElementById("teamFilter").value;
        checkboxContainer.innerHTML = "";

        if (selectedTeam === "All") return;

        const selectedPlayerNames = Array.from(checkboxContainer.querySelectorAll(".selected-pill"))
        .map(el => el.dataset.name);

        playerData
        .filter(player => player.team === selectedTeam)
        .forEach(player => {
            const btn = document.createElement("button");
            btn.dataset.name = player.ign;
            btn.className =
            "player-pill px-4 py-1 rounded-full text-sm font-semibold transition border border-gray-300 " +
            "hover:bg-purple-100 hover:text-purple-800 mb-1 mr-2";

            btn.innerHTML = player.ign;

            btn.addEventListener("click", () => {
                searchInput.value = ""; // Clear search box on click

                btn.classList.toggle("selected-pill");
                btn.classList.toggle("bg-purple-500");
                btn.classList.toggle("text-white");
                btn.classList.toggle("border-gray-300");
                btn.classList.toggle("border-purple-500");

                if (btn.classList.contains("selected-pill")) {
                    btn.innerHTML = `${player.ign}`;
                } else {
                    btn.innerHTML = player.ign;
                }

                updateVisibleCards();
                updateGenerateBtnState();
            });

            checkboxContainer.appendChild(btn);
        });
    }

    function updateVisibleCards() {
        const checkedValues = Array.from(checkboxContainer.querySelectorAll("input:checked")).map(cb => cb.value);
        const selectedTeam = teamFilter.value;

        document.querySelectorAll(".player-card").forEach(card => {
            const name = card.dataset.name;
            const player = playerData.find(p => p.ign === name);

            const matchesTeam = selectedTeam === "All" || player.team === selectedTeam;
            const matchesCheckbox = checkedValues.length === 0 || checkedValues.includes(name);

            card.style.display = matchesTeam && matchesCheckbox ? "block" : "none";
        });
    }

    function updateGenerateBtnState() {
        const selected = Array.from(checkboxContainer.querySelectorAll(".selected-pill"));

        if (selected.length === 0) {
            generateBtn.disabled = true;
            generateBtn.classList.remove(
                "bg-gradient-to-r",
                "from-purple-500",
                "to-pink-500",
                "ring-2",
                "ring-purple-300",
                "hover:ring-4",
                "hover:scale-105"
            );
            generateBtn.classList.add(
                "bg-gray-200",
                "text-gray-500",
                "cursor-not-allowed"
            );
        } else {
            generateBtn.disabled = false;
            generateBtn.classList.add(
                "bg-gradient-to-r",
                "from-purple-500",
                "to-pink-500",
                "ring-2",
                "ring-purple-300",
                "hover:ring-4",
                "hover:scale-105"
            );
            generateBtn.classList.remove(
                "bg-gray-200",
                "text-gray-500",
                "cursor-not-allowed"
            );
        }
    }

    function toggleStats(button, type) {
        const statDiv = button.nextElementSibling;
        const isHidden = statDiv.classList.contains("hidden");
        statDiv.classList.toggle("hidden");
        button.textContent = isHidden ? `Hide ${type === 'champ' ? 'Champ' : 'Game'} Stats ▲` : `Show ${type === 'champ' ? 'Champ' : 'Game'} Stats ▼`;
    }

    generateBtn.addEventListener("click", () => {
        const selected = Array.from(document.querySelectorAll(".selected-pill")).map(el => el.dataset.name);
        if (selected.length === 0) return;

        const encodedNames = selected.map(name => encodeURIComponent(name)).join(",");
        const url = `https://op.gg/lol/multisearch/na?summoners=${encodedNames}`;
        window.open(url, "_blank");
    });

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

    function updateCheckboxVisibility() {
        const selectedTeam = teamFilter.value;
        const checkboxContainer = document.getElementById("checkboxContainer");

        if (selectedTeam === "All") {
            checkboxContainer.innerHTML = ""; // hide player roster
        } else {
            renderPlayerButtons(); // show player roster for selected team only
        }
    }

    const teamFilter = document.getElementById("teamFilter");
    teamFilter.addEventListener("change", () => {
        searchInput.value = ""; // Clear the search box

        renderPlayerButtons();
        updateVisibleCards();
        updateCheckboxVisibility();
    });

    // Initial setup
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