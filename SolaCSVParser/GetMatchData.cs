using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Newtonsoft.Json;
using SolaCSVParser.Output;

namespace SolaCSVParser
{
    public static class GetMatchData
    {
        public static readonly Dictionary<string, string> TeamAbbreviations = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "Aura Farmers", "AF" },
            { "Blockspinners", "BSP" },
            { "FF", "FF" },
            { "Final Boss Phase IV", "FBP4" },
            { "Godzilla Strikes Back", "GSB" },
            { "Honey Pack", "HP" },
            { "Men-nefer", "MEN" },
            { "Oh Good Heavens", "OGH" },
            { "Revenge Arc", "REV" },
            { "Slytherin", "SLY" },
            { "Sneaky Gitz", "GITZ" },
            { "Sternritter", "STRN" },
            { "Termina Time Travelers", "TTT" },
            { "The Bnuunies", "BNU" },
            { "The Honored Ones", "HON" },
            { "Wolhaiksong", "WOL" }
        };

        public static async Task Main()
        {

            string apiKey = "RGAPI-1d867183-5942-496a-9ab0-d9536a410dc3";
            string filePath = @"C:\Users\Sola\Documents\GitHub\sdc-s21-scouting\players.json";

            // Enter match ID
            Console.Write("Enter Match ID (just the number, e.g. 5307242122): ");
            string? inputId = Console.ReadLine();

            if (string.IsNullOrWhiteSpace(inputId))
            {
                Console.WriteLine("Match ID cannot be empty.");
                return;
            }

            string matchId = $"NA1_{inputId.Trim()}";

            // Enter match date
            Console.Write("Enter match date (e.g. W1D1): ");
            string? matchDate = Console.ReadLine();

            if (string.IsNullOrWhiteSpace(matchDate))
            {
                Console.WriteLine("Match date cannot be empty.");
                return;
            }

            if (!File.Exists(filePath))
            {
                Console.WriteLine("players.json not found.");
                return;
            }

            var players = JsonConvert.DeserializeObject<List<Player>>(File.ReadAllText(filePath));
            if (players == null)
            {
                Console.WriteLine("Failed to deserialize players.");
                return;
            }

            using HttpClient client = new HttpClient();
            string url = $"https://americas.api.riotgames.com/lol/match/v5/matches/{matchId}?api_key={apiKey}";

            HttpResponseMessage response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"Failed to get match data: {response.StatusCode}");
                return;
            }

            string json = await response.Content.ReadAsStringAsync();
            var matchDetail = System.Text.Json.JsonSerializer.Deserialize<MatchDetail>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (matchDetail == null || matchDetail.info == null)
            {
                Console.WriteLine("Match detail is null.");
                return;
            }

            // Step 1: Map puuid -> teamName from players.json
            var teamMapping = new Dictionary<string, string>();
            foreach (var participant in matchDetail.info.participants)
            {
                var player = players.Find(p => p.puuid == participant.puuid);
                if (player != null)
                {
                    teamMapping[participant.puuid] = player.team;
                }
            }

            var uniqueTeams = teamMapping.Values.Distinct().ToList();
            if (uniqueTeams.Count != 2)
            {
                Console.WriteLine("Could not determine exactly 2 teams in the match.");
                return;
            }

            string team1 = uniqueTeams[0];
            string team2 = uniqueTeams[1];
            string team1Abbr = TeamAbbreviations.GetValueOrDefault(team1, "--");
            string team2Abbr = TeamAbbreviations.GetValueOrDefault(team2, "--");

            // Step 2: For each participant, add new match data
            foreach (var participant in matchDetail.info.participants)
            {
                var player = players.Find(p => p.puuid == participant.puuid);
                if (player == null)
                {
                    Console.WriteLine($"No match found in players.json for: {participant.summonerName}");
                    continue;
                }

                // Ensure gameStats list is initialized
                player.gameStats ??= new List<GameStats>();

                // Skip entering match details if it exists
                bool alreadyExists = player.gameStats.Any(gs => gs.matchId == matchId);
                if (alreadyExists)
                {
                    Console.WriteLine($"Skipped {player.ign}, match already recorded.");
                    continue;
                }

                // Add new match stat
                string opponentTeam = player.team == team1 ? team2 : team1;
                string opponentAbbr = player.team == team1 ? team2Abbr : team1Abbr;

                player.gameStats.Add(new GameStats
                {
                    ign = player.ign,
                    matchId = matchId,
                    date = matchDate.Trim(),
                    champion = participant.championName,
                    k = participant.kills.ToString(),
                    d = participant.deaths.ToString(),
                    a = participant.assists.ToString(),
                    kda = participant.challenges.kda,
                    result = participant.win ? "win" : "lose",
                    vs = opponentTeam,
                    vsAbbr = opponentAbbr
                });

                // Add champ to champs played list
                player.champsPlayed.Add(participant.championName);

                // Make sure there are KDA values to average, then calculate KDA. Round to 2 decimal places.
                if (player.gameStats != null && player.gameStats.Count > 0)
                {
                    player.avgKDA = (float)Math.Round(player.gameStats.Average(gs => gs.kda), 2);
                }

                Console.WriteLine($"Recorded stats for {player.ign} vs {opponentAbbr}");

                await Task.Delay(300); // rate limit buffer
            }

            File.WriteAllText(filePath, JsonConvert.SerializeObject(players, Formatting.Indented));
            Console.WriteLine("All gameStats updated!");
        }


        /* OLD VERSION
         * 
        public static async Task Main()
        {
            HttpClient client = new HttpClient();

            string gameId = "NA1_5307242122";
            string apiKey = "RGAPI-1d867183-5942-496a-9ab0-d9536a410dc3";
            string url = $"https://americas.api.riotgames.com/lol/match/v5/matches/{gameId}?api_key={apiKey}";

            using (client)
            {
                HttpResponseMessage response = await client.GetAsync(url);

                string content = await response.Content.ReadAsStringAsync();

                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                // Deserialize<TValue>(string, JsonSerializerOptions)
                // https://learn.microsoft.com/en-us/dotnet/api/system.text.json.jsonserializer.deserialize?view=net-9.0
                MatchData? match = System.Text.Json.JsonSerializer.Deserialize<MatchData>(content, options);

                if (match == null)
                {
                    Console.WriteLine("Could not deserialize the match data.");
                    return;
                }

                Console.WriteLine("Metadata Participants (PUUIDs):");
                foreach (var puuid in match.metadata.participants)
                {
                    Console.WriteLine($"- {puuid}");
                }

                Console.WriteLine("\nParticipant Stats:");
                foreach (var p in match.info.participants)
                {
                    Console.WriteLine($"{p.riotIdGameName}#{p.riotIdTagline} - {p.championName}");
                    Console.WriteLine($"Kills: {p.kills}, Deaths: {p.deaths}, Assists: {p.assists}, Win: {p.win}");
                    Console.WriteLine();
                }
            }
        }
        */

        // "metadata"
        // participants
        // "info"
        // "info.participants"
        // assists
        // championName
        // deaths
        // kills
        // riotIdGameName
        // riotIdTagline
        // win

        /* HTTPClient Tutorial/Resources:
         * https://kenslearningcurve.com/tutorials/getting-started-with-httpclient-in-c/
         * https://learn.microsoft.com/en-us/dotnet/fundamentals/networking/http/httpclient?utm_source=chatgpt.com
         * 
        public class Joke
        {
            public string Setup { get; set; }
            public string Punchline { get; set; }
        }
        */
    }
}