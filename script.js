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
const roster = document.getElementById("roster");
const checkboxContainer = document.getElementById("checkboxContainer");

function fetchData() {
  fetch("players.json")
    .then(res => res.json())
    .then(data => {
      playerData = data.map(p => ({
        ...p,
        roles: p.roles ? p.roles.split(",").map(r => r.trim()) : []
      }));
      renderCheckboxes();
      renderPlayerCards();
    });
}

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

fetchData();
