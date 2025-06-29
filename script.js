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
                    <td>
                        <button type="button" class="view-match-btn text-blue-600 underline" data-matchid="${g.matchId}">
                            View
                        </button>
                    </td>
                </tr>`
            ).join("");

            const champCounts = player.champsPlayed.reduce((acc, champ) => {
                acc[champ] = (acc[champ] || 0) + 1;
                return acc;
            }, {});

            // Sort champ entries by count descending
            const sortedChamps = Object.entries(champCounts)
                .sort((a, b) => b[1] - a[1]);

            const champsPlayedSummary = sortedChamps
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
                            <thead>
                              <tr>
                                <th>Date</th><th>Champion</th><th>K</th><th>D</th><th>A</th><th class="text-center">Result</th><th>vs Team</th><th>Match</th>
                              </tr>
                            </thead>
                            <tbody>${gameStatsHtml}</tbody>
                        </table>
                        <div class="mt-6 border-t pt-3">
                            <h4 class="font-semibold text-gray-700 mb-2">Player Overview</h4>
                            <ul class="text-sm leading-6">
                                <li><strong>Avg KDA:</strong> <span class="${kdaColor}">${player.avgKDA}</span></li>
                                <li><strong>Total Games:</strong> ${player.gameStats.length}</li>
                                <li><strong>Winrate:</strong> ${player.gameStats.length > 0
                                            ? Math.round(
                                                (player.gameStats.filter(g => g.result.toLowerCase() === "win").length /
                                                    player.gameStats.length) *
                                                100
                                            ) + "%"
                                            : "N/A"
                                        }</li>
                            </ul>

                            <h4 class="font-semibold text-gray-700 mt-4 mb-1">Champs Played</h4>
                            <table class="table-auto w-full text-left mb-2">
                                <tbody>${champsPlayedSummary}</tbody>
                            </table>
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
        const selectedTeam = teamFilter.value;
        const selectedPills = Array.from(checkboxContainer.querySelectorAll(".selected-pill"));
        const selectedIGNs = selectedPills.map(btn => btn.dataset.name);

        document.querySelectorAll(".player-card").forEach(card => {
            const name = card.dataset.name;
            const player = playerData.find(p => p.ign === name);

            const matchesTeam = selectedTeam === "All" || player.team === selectedTeam;
            const matchesSelection = selectedIGNs.length === 0 || selectedIGNs.includes(name);

            // Show only selected players from selected team
            card.style.display = matchesTeam && matchesSelection ? "block" : "none";
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
        // Clear all selected pills
        document.querySelectorAll(".selected-pill").forEach(pill => {
            pill.classList.remove("selected-pill", "bg-purple-500", "text-white", "border-purple-500");
            pill.classList.add("border-gray-300");
        });

        // Clear search input
        searchInput.value = "";

        renderPlayerButtons();
        updateVisibleCards();
        updateCheckboxVisibility();
    });

    document.body.addEventListener("click", async (e) => {
        if (e.target.classList.contains("view-match-btn")) {
            const matchId = e.target.dataset.matchid;
            const modal = document.getElementById("matchModal");
            const content = document.getElementById("matchModalContent");

            content.innerHTML = "Loading match data...";

            try {
                const response = await fetch(`matches/${matchId}.json`);
                const match = await response.json();
                content.innerHTML = buildMatchModalContent(match);
                modal.classList.remove("hidden");
            } catch (err) {
                content.innerHTML = "Error loading match data.";
            }
        }
    });

    document.getElementById("closeModal").addEventListener("click", () => {
        document.getElementById("matchModal").classList.add("hidden");
    });

    function buildMatchModalContent(match) {
        const getSpellName = (id) => ({
            1: "SummonerBoost",
            3: "SummonerExhaust",
            4: "SummonerFlash",
            6: "SummonerHaste",
            7: "SummonerHeal",
            11: "SummonerSmite",
            12: "SummonerTeleport",
            14: "SummonerDot",
            21: "SummonerBarrier",
            32: "SummonerSnowball"
        }[id] || "SummonerFlash");

        const getItemIcons = (p, isWinner) => {
            const emptyColor = isWinner ? "bg-green-300/40" : "bg-red-300/40";

            // Core items (slots 0 to 5)
            const itemSlots = Array.from({ length: 6 }, (_, i) => {
                const id = p[`item${i}`];
                const name = itemNames[id] || `Item ${id}`;
                return id && id !== 0
                    ? `<img src="https://opgg-static.akamaized.net/meta/images/lol/15.13.1/item/${id}.png"
                        class="w-6 h-6 md:w-7 md:h-7 rounded-sm" title="${name}" />`
                    : `<div class="w-6 h-6 md:w-7 md:h-7 ${emptyColor} rounded-sm inline-block" title="Empty Slot"></div>`;
            });

            // Trinket (always item6)
            const trinketId = p.item6;
            const trinketName = itemNames[trinketId] || `Item ${trinketId}`;
            const trinket = trinketId && trinketId !== 0
                ? `<img src="https://opgg-static.akamaized.net/meta/images/lol/15.13.1/item/${trinketId}.png"
                    class="w-6 h-6 md:w-7 md:h-7 rounded-full ring-1 ring-gray-300" title="${trinketName}" />`
                : `<div class="w-6 h-6 md:w-7 md:h-7 ${emptyColor} rounded-full inline-block" title="Empty Trinket"></div>`;

            // Combine item slots + trinket
            return [...itemSlots, trinket].join("");
        };


        const getTeamName = (teamId) => {
            const puuid = match.info.participants.find(p => p.teamId === teamId)?.puuid;
            const player = playerData.find(p => p.puuid === puuid);
            return player?.team || `Team ${teamId}`;
        };

        const renderTeam = (teamId, isWinner) => {
            const players = match.info.participants.filter(p => p.teamId === teamId);

            return players.map(p => {
                const knownPlayer = playerData.find(pl => pl.puuid === p.puuid);
                const tier = knownPlayer?.tier;
                const rank = knownPlayer?.rank;
                const rankIcon = rankIcons?.[rank] || "";

                const tierColor =
                    tier === "1" ? "bg-red-200" :
                        tier === "2" ? "bg-orange-200" :
                            tier === "3" ? "bg-blue-200" :
                                "bg-green-200";

                return `
                <tr class="text-left align-middle ${isWinner ? 'bg-green-50' : 'bg-red-50'}">
                    <td class="py-2 px-2 text-sm font-medium align-top whitespace-nowrap">
                        <div class="mb-1 font-semibold">${p.riotIdGameName}#${p.riotIdTagline}</div>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs font-semibold px-2 py-0.5 rounded ${tierColor}">T${tier || '?'}</span>
                            ${rankIcon ? `<img src="${rankIcon}" class="w-5 h-5 inline-block" title="${rank}" />` : ''}
                            <span class="text-xs text-gray-600">${rank || ''}</span>
                        </div>
                    </td>
                    <td class="py-2 px-1 text-sm text-center">
                        <div class="flex items-center justify-center gap-1 flex-col">
                            <img src="https://opgg-static.akamaized.net/meta/images/lol/15.13.1/champion/${p.championName}.png"
                                class="w-6 h-6 rounded-sm" alt="${p.championName}" />
                            <span class="text-gray-500 text-xs">${p.championName}</span>
                        </div>
                    </td>
                    <td class="py-2 px-1 text-sm text-center">${p.kills}/${p.deaths}/${p.assists}</td>
                    <td class="py-2 px-1 text-center">
                        <div class="flex justify-center gap-1">
                            <img src="https://ddragon.leagueoflegends.com/cdn/14.12.1/img/spell/${getSpellName(p.summoner1Id)}.png" class="w-5" />
                            <img src="https://ddragon.leagueoflegends.com/cdn/14.12.1/img/spell/${getSpellName(p.summoner2Id)}.png" class="w-5" />
                        </div>
                    </td>
                    <td class="py-2 px-1 text-left">
                        <div class="flex flex-wrap justify-start gap-[2px]">
                            ${getItemIcons(p)}
                        </div>
                    </td>
                </tr>`;
            }).join("");
        };

        const teams = [...new Set(match.info.participants.map(p => p.teamId))];
        const winningTeam = match.info.teams.find(t => t.win === true)?.teamId;

        return `
        <div>
            <div class="flex flex-col gap-6 items-center w-full">
                ${teams.map(teamId => {
                const isWinner = teamId === winningTeam;
                const name = getTeamName(teamId);
                const headerColor = isWinner ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900';

                return `
                    <div class="w-full max-w-3xl">
                        <h3 class="text-center font-semibold text-base mb-2 w-full ${isWinner ? 'text-green-600' : 'text-red-600'}">
                            ${isWinner ? '🏆 ' : ''}${name}
                        </h3>
                        <table class="table-auto text-xs w-full bg-white border rounded overflow-hidden">
                            <thead class="${headerColor} text-center">
                                <tr>
                                    <th class="p-2 text-left">Player</th>
                                    <th class="p-2">Champ</th>
                                    <th class="p-2">KDA</th>
                                    <th class="p-2">Spells</th>
                                    <th class="p-2 text-left">Items</th>
                                </tr>
                            </thead>
                            <tbody>${renderTeam(teamId, isWinner)}</tbody>
                        </table>
                    </div>`;
            }).join("")}
            </div>
        </div>`;
    }

    // Close modal if open
    document.addEventListener("click", (e) => {
        const modal = document.getElementById("matchModal");
        const content = document.getElementById("matchModalContent");

        if (!modal.classList.contains("hidden") && !content.contains(e.target) && e.target.id !== "matchModalContent") {
            modal.classList.add("hidden");
        }
    });

    // Initial setup
    fetchPlayers();
    window.toggleStats = toggleStats;
    updateCheckboxVisibility();
    updateGenerateBtnState();

    const searchInput = document.getElementById("searchInput");

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();

        // Clear all selected pills when typing
        document.querySelectorAll(".selected-pill").forEach(pill => {
            pill.classList.remove("selected-pill", "bg-purple-500", "text-white", "border-purple-500");
            pill.classList.add("border-gray-300");
        });

        // Change team filter to "All"
        teamFilter.value = "All";
        updateCheckboxVisibility(); // hides roster since it's not relevant during search

        // Update search-based visibility
        document.querySelectorAll(".player-card").forEach(card => {
            const name = card.dataset.name.toLowerCase();
            card.style.display = name.includes(query) ? "block" : "none";
        });
    });
});