const playersURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSAt4BeVzIt7X3HmqAWIPp975LP9LejP9GMyfUeGn8C4QB4e3tn8QG2ayLU9GRenRRAhOXr3w1Mg0uT/pub?gid=0&single=true&output=csv";
const topChampsURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSAt4BeVzIt7X3HmqAWIPp975LP9LejP9GMyfUeGn8C4QB4e3tn8QG2ayLU9GRenRRAhOXr3w1Mg0uT/pub?gid=1151497043&single=true&output=csv";
const gameStatsURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSAt4BeVzIt7X3HmqAWIPp975LP9LejP9GMyfUeGn8C4QB4e3tn8QG2ayLU9GRenRRAhOXr3w1Mg0uT/pub?gid=220574329&single=true&output=csv";

const roleIcons = {
  Top: "https://wiki.leagueoflegends.com/en-us/images/thumb/Top_icon.png/120px-Top_icon.png",
  Jungle: "https://wiki.leagueoflegends.com/en-us/images/thumb/Jungle_icon.png/120px-Jungle_icon.png",
  Mid: "https://wiki.leagueoflegends.com/en-us/images/thumb/Middle_icon.png/120px-Middle_icon.png",
  Bot: "https://wiki.leagueoflegends.com/en-us/images/thumb/Bottom_icon.png/120px-Bottom_icon.png",
  Support: "https://wiki.leagueoflegends.com/en-us/images/thumb/Support_icon.png/120px-Support_icon.png"
};

const rankIcons = {
  Gold: "https://static.wikia.nocookie.net/leagueoflegends/images/7/78/Season_2023_-_Gold.png",
  Platinum: "https://static.wikia.nocookie.net/leagueoflegends/images/b/bd/Season_2023_-_Platinum.png",
  Emerald: "https://static.wikia.nocookie.net/leagueoflegends/images/4/4b/Season_2023_-_Emerald.png",
  Diamond: "https://static.wikia.nocookie.net/leagueoflegends/images/3/37/Season_2023_-_Diamond.png",
  Master: "https://static.wikia.nocookie.net/leagueoflegends/images/d/d5/Season_2023_-_Master.png",
  Grandmaster: "https://static.wikia.nocookie.net/leagueoflegends/images/6/64/Season_2023_-_Grandmaster.png",
  Challenger: "https://static.wikia.nocookie.net/leagueoflegends/images/1/14/Season_2023_-_Challenger.png"
};

let playerData = [];

async function fetchCSV(url) {
  const response = await fetch(url);
  const text = await response.text();
  const [header, ...rows] = text.trim().split("\n").map(row => row.split(","));
  return rows.map(row =>
    Object.fromEntries(header.map((h, i) => [h.trim(), row[i]?.trim() || ""]))
  );
}

async function fetchAllData() {
  const [players, champs, games] = await Promise.all([
    fetchCSV(playersURL),
    fetchCSV(topChampsURL),
    fetchCSV(gameStatsURL)
  ]);

  const champMap = {};
  for (const c of champs) {
    if (!champMap[c.Name]) champMap[c.Name] = [];
    champMap[c.Name].push({
      champion: c.Champion,
      games: +c.Games,
      kda: c.KDA,
      winRate: c["Win%"]
    });
  }

  const gameMap = {};
  for (const g of games) {
    if (!gameMap[g.Name]) gameMap[g.Name] = [];
    gameMap[g.Name].push({
      champion: g.Champion,
      k: +g.K,
      d: +g.D,
      a: +g.A,
      result: g.Result,
      vs: g["vs Team"],
      vsAbbr: (g["vs Team"] || "")
        .split(" ")
        .map(w => w[0])
        .join("")
        .toUpperCase()
    });
  }

  playerData = players.map(p => ({
    name: `${p.Name}#${p.Tagline}`,
    tier: +p.Tier,
    points: +p.Points,
    rank: p.Rank,
    roles: (p.Roles || "")
      .replace(/\\/g, "")
      .split(",")
      .map(r => r.trim()),
    opgg: p["op.gg Link"],
    topChampions: (champMap[p.Name] || []).map(c => c.champion),
    champStats: champMap[p.Name] || [],
    gameStats: gameMap[p.Name] || [],
    champsPlayed: (champMap[p.Name] || []).map(c => ({
      champ: c.champion,
      games: c.games
    })),
    avgKDA: calculateAverageKDA(gameMap[p.Name] || [])
  }));

  renderCheckboxes();
  renderPlayerCards();
}

function calculateAverageKDA(games) {
  if (!games.length) return 0;
  const total = games.reduce(
    (acc, g) => {
      acc.k += g.k;
      acc.d += g.d;
      acc.a += g.a;
      return acc;
    },
    { k: 0, d: 0, a: 0 }
  );
  return ((total.k + total.a) / Math.max(total.d, 1)).toFixed(1);
}

// ... define renderCheckboxes, renderPlayerCards, updateVisibleCards, toggleStats etc as before ...

function renderCheckboxes() {
  checkboxContainer.innerHTML = `
    <p class="text-center font-semibold mb-2">View all selected players on op.gg:</p>
    <div class="flex justify-center mb-2">
      <a id="multiOpggLink" href="#" target="_blank">
        <button class="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded transition text-sm font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" class="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 0a8 8 0 1 0 8 8A8.009 8.009 0 0 0 8 0Zm2.922 11.414A5.952 5.952 0 0 1 8 12a6.005 6.005 0 0 1-5.917-5H3.6a4.8 4.8 0 0 0 7.379 4.414Zm1.495-3.414h1.517A6.005 6.005 0 0 1 8 14a5.952 5.952 0 0 1-2.922-.586l-.728 1.267A7.958 7.958 0 0 0 8 16a8.005 8.005 0 0 0 7.917-7h-1.517a4.8 4.8 0 0 0-1.983-1.586Z"/>
          </svg>
          Generate Multi op.gg
        </button>
      </a>
    </div>
  `;

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

    checkbox.addEventListener("change", updateVisibleCards);
  });
}

function updateVisibleCards() {
  const checkedValues = Array.from(checkboxContainer.querySelectorAll("input:checked"))
    .map(cb => cb.value);
  document.querySelectorAll(".player-card").forEach(card => {
    const name = card.dataset.name;
    card.style.display = checkedValues.length === 0 || checkedValues.includes(name) ? "block" : "none";
  });

  const multiOpggLink = document.getElementById("multiOpggLink");
  const encodedSummoners = checkedValues.map(name => encodeURIComponent(name)).join("%2C");
  multiOpggLink.href = `https://op.gg/lol/multisearch/na?summoners=${encodedSummoners}`;
}

function toggleStats(button, type) {
  const statDiv = button.nextElementSibling;
  const isHidden = statDiv.classList.contains("hidden");
  statDiv.classList.toggle("hidden");
  button.textContent = isHidden
    ? `Hide ${type === "champ" ? "Champ" : "Game"} Stats ▲`
    : `Show ${type === "champ" ? "Champ" : "Game"} Stats ▼`;
}

function renderPlayerCards() {
  roster.innerHTML = "";
  playerData.forEach(player => {
    const card = document.createElement("div");
    card.className = "player-card rounded-lg shadow-md p-4 bg-white";
    card.dataset.name = player.name;

    const tierColor = {
      1: "bg-red-200",
      2: "bg-orange-200",
      3: "bg-blue-200",
      4: "bg-green-200"
    }[player.tier];

    const rolesHtml = player.roles.map(role =>
      `<img src="${roleIcons[role]}" alt="${role}" class="w-6 h-6 inline">`
    ).join(" ");

    const rankIcon = rankIcons[player.rank] || "";
    const rankHtml = rankIcon
      ? `<img src="${rankIcon}" alt="${player.rank}" class="w-5 h-5 inline ml-1">`
      : "";

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
      <p><strong>Rank:</strong> ${player.rank} ${rankHtml}</p>
      <p><strong>Roles:</strong> ${player.roles.join(", ")}</p>
      <p><strong>Tier:</strong> Tier ${player.tier} (${player.points} pts)</p>
      <p><strong>Top Champions:</strong> ${player.topChampions?.join(", ") || "N/A"}</p>
    `;
    roster.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fetchAllData();
});