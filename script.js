document.addEventListener("DOMContentLoaded", () => {
  const roster = document.getElementById("roster");
  const checkboxContainer = document.getElementById("checkboxContainer");

  let playerData = [];

  // CSV URLs
  const urls = {
    players: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSAt4BeVzIt7X3HmqAWIPp975LP9LejP9GMyfUeGn8C4QB4e3tn8QG2ayLU9GRenRRAhOXr3w1Mg0uT/pub?gid=0&single=true&output=csv",
    topChamps: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSAt4BeVzIt7X3HmqAWIPp975LP9LejP9GMyfUeGn8C4QB4e3tn8QG2ayLU9GRenRRAhOXr3w1Mg0uT/pub?gid=1151497043&single=true&output=csv",
    gameStats: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSAt4BeVzIt7X3HmqAWIPp975LP9LejP9GMyfUeGn8C4QB4e3tn8QG2ayLU9GRenRRAhOXr3w1Mg0uT/pub?gid=220574329&single=true&output=csv"
  };

  async function fetchCSV(url) {
    const res = await fetch(url);
    const text = await res.text();
    const [headerLine, ...lines] = text.trim().split("\n");
    const headers = headerLine.split(",");
    return lines.map(line => {
      const values = line.split(",");
      const obj = {};
      headers.forEach((h, i) => (obj[h.trim()] = values[i]?.trim()));
      return obj;
    });
  }

  async function fetchAllData() {
    const [players, topChamps, gameStats] = await Promise.all([
      fetchCSV(urls.players),
      fetchCSV(urls.topChamps),
      fetchCSV(urls.gameStats)
    ]);

    // Group top champs and games by name
    const champMap = {};
    topChamps.forEach(row => {
      const name = row.name;
      if (!champMap[name]) champMap[name] = [];
      champMap[name].push({
        champion: row.champion,
        games: +row.games,
        kda: row.kda,
        winRate: row.winrate
      });
    });

    const gameMap = {};
    gameStats.forEach(row => {
      const name = row.name;
      if (!gameMap[name]) gameMap[name] = [];
      gameMap[name].push({
        champion: row.champion,
        k: +row.k,
        d: +row.d,
        a: +row.a,
        result: row.result,
        vs: row.vs,
        vsAbbr: row.vsAbbr
      });
    });

    // Merge everything
    playerData = players.map(p => ({
      name: p.name,
      tier: +p.tier,
      points: +p.points,
      rank: p.rank,
      roles: (p.roles || "").split(",").map(r => r.trim()),
      opgg: p.opgg,
      topChampions: p.topChampions.split(";").map(c => c.trim()),
      champStats: champMap[p.name] || [],
      gameStats: gameMap[p.name] || [],
      champsPlayed: (champMap[p.name] || []).map(c => ({ champ: c.champion, games: c.games })),
      avgKDA: +p.avgKDA
    }));
    
    console.log("Player record:", p);

    renderPlayerCards();
    renderCheckboxes();
  }

  function renderPlayerCards() {
    roster.innerHTML = "";
    playerData.forEach(player => {
      const card = document.createElement("div");
      card.className = "player-card rounded-lg shadow-md p-4 bg-white";
      card.dataset.name = player.name.toLowerCase();

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

      const rankIcon = rankIcons[player.rank] ? `<img src="${rankIcons[player.rank]}" class="w-6 h-6 inline ml-1 align-middle" title="${player.rank}" />` : "";

      card.innerHTML = `
        <div class="flex items-center mb-2">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <span class="text-sm font-semibold px-2 py-1 rounded ${tierColor}">Tier ${player.tier}</span>
            ${player.name}
            ${rolesHtml}
          </h2>
        </div>
        <a href="${player.opgg}" target="_blank">
          <button class="mb-2 text-sm text-white bg-pink-500 hover:bg-pink-600 px-3 py-1 rounded transition">View op.gg</button>
        </a>
        <p><strong>Rank:</strong> ${player.rank || "Unknown"} ${rankIcon}</p>
        <p><strong>Roles:</strong> ${player.roles.join(", ")}</p>
        <p><strong>Tier:</strong> Tier ${player.tier} (${player.points} pts)</p>
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
      `;
      roster.appendChild(card);
    });
  }

  function renderCheckboxes() {
    checkboxContainer.innerHTML = "";

    // Add static button
    const button = document.createElement("a");
    button.id = "multiOpggLink";
    button.href = "#";
    button.target = "_blank";
    button.className = "mb-2 inline-block bg-pink-500 text-white px-4 py-2 rounded text-sm hover:bg-pink-600 transition";
    button.textContent = "Generate Multi op.gg";
    checkboxContainer.appendChild(button);

    playerData.forEach(player => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `cb-${player.name}`;
      checkbox.value = player.name;
      checkbox.classList.add("mr-2");

      const label = document.createElement("label");
      label.htmlFor = `cb-${player.name}`;
      label.textContent = player.name;

      const wrapper = document.createElement("div");
      wrapper.classList.add("flex", "items-center");
      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);

      checkboxContainer.appendChild(wrapper);
      checkbox.addEventListener("change", updateMultiOpggLink);
    });
  }

  function updateMultiOpggLink() {
    const checked = Array.from(checkboxContainer.querySelectorAll("input:checked")).map(cb => cb.value);
    const url = "https://op.gg/lol/multisearch/na?summoners=" + checked.map(encodeURIComponent).join("%2C");
    document.getElementById("multiOpggLink").href = url;
  }

  function toggleStats(button, type) {
    const statDiv = button.nextElementSibling;
    const isHidden = statDiv.classList.contains("hidden");
    statDiv.classList.toggle("hidden");
    button.textContent = isHidden ? `Hide ${type === 'champ' ? 'Champ' : 'Game'} Stats ▲` : `Show ${type === 'champ' ? 'Champ' : 'Game'} Stats ▼`;
  }

  const roleIcons = {
    "Top": "https://wiki.leagueoflegends.com/en-us/images/thumb/Top_icon.png/120px-Top_icon.png",
    "Jungle": "https://wiki.leagueoflegends.com/en-us/images/thumb/Jungle_icon.png/120px-Jungle_icon.png",
    "Mid": "https://wiki.leagueoflegends.com/en-us/images/thumb/Middle_icon.png/120px-Middle_icon.png",
    "Bot": "https://wiki.leagueoflegends.com/en-us/images/thumb/Bottom_icon.png/120px-Bottom_icon.png",
    "Support": "https://wiki.leagueoflegends.com/en-us/images/thumb/Support_icon.png/120px-Support_icon.png"
  };

  const rankIcons = {
    Gold: "https://static.wikia.nocookie.net/leagueoflegends/images/7/78/Season_2023_-_Gold.png",
    Platinum: "https://static.wikia.nocookie.net/leagueoflegends/images/b/bd/Season_2023_-_Platinum.png",
    Emerald: "https://static.wikia.nocookie.net/leagueoflegends/images/4/4b/Season_2023_-_Emerald.png",
    Diamond: "https://static.wikia.nocookie.net/leagueoflegends/images/3/37/Season_2023_-_Diamond.png/",
    Master: "https://static.wikia.nocookie.net/leagueoflegends/images/d/d5/Season_2023_-_Master.png",
    Grandmaster: "https://static.wikia.nocookie.net/leagueoflegends/images/6/64/Season_2023_-_Grandmaster.png",
    Challenger: "https://static.wikia.nocookie.net/leagueoflegends/images/1/14/Season_2023_-_Challenger.png"
  };

  fetchAllData();
  window.toggleStats = toggleStats;
});