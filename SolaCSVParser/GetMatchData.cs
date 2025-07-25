﻿using System;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Newtonsoft.Json;
using SolaCSVParser.Output;
using DotNetEnv;

namespace SolaCSVParser
{
    public static class GetMatchData
    {
        public static readonly Dictionary<string, string> TeamAbbreviations = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "Aura Farmers", "AF" },
            { "Blockspinners", "BSP" },
            { "FF", "FF" },
            { "Final Boss Phase X", "FBPX" },
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
            DotNetEnv.Env.Load(@"C:\Users\Sola\Documents\GitHub\sdc-s21-scouting\.env"); // This reads from .env file in the project root
            string? apiKey = Environment.GetEnvironmentVariable("RIOT_API_KEY");

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                Console.WriteLine("Missing Riot API key in .env file.");
                return;
            }

            string filePath = @"C:\Users\Sola\Documents\GitHub\sdc-s21-scouting\players.json";

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

            // await PopulatePuuids(players, apiKey, filePath);

            using HttpClient client = new HttpClient();

            Console.Write("Enter match date (e.g. 6/17): ");
            string? matchDate = Console.ReadLine();

            if (string.IsNullOrWhiteSpace(matchDate))
            {
                Console.WriteLine("Match date cannot be empty.");
                Console.WriteLine();
                return;
            }

            while (true)
            {
                // Enter match ID
                Console.Write("Enter Match ID (just the number, e.g. 5307242122): ");
                string? inputId = Console.ReadLine();

                if (string.IsNullOrWhiteSpace(inputId))
                {
                    Console.WriteLine("Match ID cannot be empty.");
                    Console.WriteLine();
                    continue;
                }

                string matchId = $"NA1_{inputId.Trim()}";
                string url = $"https://americas.api.riotgames.com/lol/match/v5/matches/{matchId}?api_key={apiKey}";

                HttpResponseMessage response = await client.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Failed to get match data: {response.StatusCode}");
                    Console.WriteLine();
                    continue;
                }

                string json = await response.Content.ReadAsStringAsync();
                var matchDetail = System.Text.Json.JsonSerializer.Deserialize<MatchDetail>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (matchDetail == null || matchDetail.info == null)
                {
                    Console.WriteLine("Match detail is null.");
                    Console.WriteLine();
                    continue;
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
                    Console.WriteLine($"Found {uniqueTeams.Count} unique team(s):");

                    foreach (var team in uniqueTeams)
                    {
                        Console.WriteLine($"- {team}");
                    }

                    Console.WriteLine("\nFull mapping of participants in this match:");
                    foreach (var participant in matchDetail.info.participants)
                    {
                        var player = players.Find(p => p.puuid == participant.puuid);
                        string ign = $"{participant.riotIdGameName}#{participant.riotIdTagline}";
                        string team = player?.team ?? "(no team found)";
                        Console.WriteLine($"- {ign} -> {team}");
                    }

                    Console.WriteLine();
                    continue;
                }

                string team1 = uniqueTeams[0];
                string team2 = uniqueTeams[1];
                string team1Abbr = TeamAbbreviations.GetValueOrDefault(team1, "--");
                string team2Abbr = TeamAbbreviations.GetValueOrDefault(team2, "--");

                // Step 2: For each participant, add new match data
                bool continueMatchLoop = false;

                foreach (var participant in matchDetail.info.participants)
                {
                    var player = players.Find(p => p.puuid == participant.puuid);

                    if (player == null)
                    {
                        string ign = $"{participant.riotIdGameName}#{participant.riotIdTagline}";
                        Console.WriteLine($"No player found in players.json for: {ign}");

                        Console.Write("Do you want to add this player to players.json? (y/n): ");
                        string? responseInput = Console.ReadLine()?.Trim().ToLower();

                        if (responseInput != "y")
                        {
                            Console.WriteLine("Skipping unknown player.");
                            continue;
                        }

                        // Validate team name or allow skip
                        string? newTeam = null;
                        while (true)
                        {
                            Console.Write($"Enter team name for {ign} (or type 'skip' to skip this player): ");
                            string? input = Console.ReadLine()?.Trim();

                            if (string.Equals(input, "skip", StringComparison.OrdinalIgnoreCase))
                            {
                                Console.WriteLine("Skipping player.");
                                continueMatchLoop = true;
                                break;
                            }

                            if (!string.IsNullOrWhiteSpace(input) && GetMatchData.TeamAbbreviations.ContainsKey(input))
                            {
                                newTeam = input;
                                break;
                            }

                            Console.WriteLine("Invalid team name. Please enter one of the following:");
                            foreach (var name in GetMatchData.TeamAbbreviations.Keys.OrderBy(n => n))
                            {
                                Console.WriteLine($"- {name}");
                            }
                        }

                        if (continueMatchLoop) continue;

                        player = new Player
                        {
                            ign = ign,
                            puuid = participant.puuid,
                            team = newTeam ?? "",
                            rank = "",
                            tier = "",
                            opgg = $"https://op.gg/lol/summoners/na/{Uri.EscapeDataString(participant.riotIdGameName)}-{participant.riotIdTagline}".ToLower(),
                            roles = new List<string>(),
                            champStats = new List<ChampionStats>(),
                            gameStats = new List<GameStats>(),
                            topChamps = new List<string>(),
                            champsPlayed = new List<string>(),
                            points = "",
                            avgKDA = 0
                        };

                        players.Add(player);
                        File.WriteAllText(filePath, JsonConvert.SerializeObject(players, Formatting.Indented));
                        Console.WriteLine($"Added new player {ign} to players.json.");
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

                    // Add champ to champs played list only if match was successfully added
                    player.champsPlayed ??= new List<string>();
                    player.champsPlayed.Add(participant.championName);

                    // Make sure there are KDA values to average, then calculate KDA. Round to 2 decimal places.
                    if (player.gameStats != null && player.gameStats.Count > 0)
                    {
                        player.avgKDA = (float)Math.Round(player.gameStats.Average(gs => gs.kda), 2);
                    }

                    Console.WriteLine($"Recorded stats for {player.ign} vs {opponentAbbr}");

                    await Task.Delay(300); // rate limit buffer
                }

                // At the end, save the file
                File.WriteAllText(filePath, JsonConvert.SerializeObject(players, Formatting.Indented));
                Console.WriteLine("Match processed and data updated!");
                Console.WriteLine(); // just for spacing

                // Save full match data to a .json file
                try
                {
                    string outputFolder = @"C:\Users\Sola\Documents\GitHub\sdc-s21-scouting\matches";
                    if (!Directory.Exists(outputFolder))
                        Directory.CreateDirectory(outputFolder);

                    string outFile = Path.Combine(outputFolder, $"{matchId}.json");

                    if (!File.Exists(outFile))
                    {
                        await File.WriteAllTextAsync(outFile, json);
                        Console.WriteLine($"Saved full match JSON to: {outFile}");
                        Console.WriteLine();
                    }
                    else
                    {
                        Console.WriteLine($"Match JSON already exists: {outFile}");
                        Console.WriteLine();
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to save match JSON: {ex.Message}");
                    Console.WriteLine();
                }
            }
        }

        public static async Task PopulatePuuids(List<Player> players, string apiKey, string filePath)
        {
            using HttpClient client = new HttpClient();

            foreach (var player in players)
            {
                if (!string.IsNullOrEmpty(player.puuid))
                {
                    Console.WriteLine($"Already has PUUID: {player.ign}");
                    continue;
                }

                if (!player.ign.Contains('#'))
                {
                    Console.WriteLine($"Skipping malformed IGN: {player.ign}");
                    continue;
                }

                string[] split = player.ign.Split('#');
                string gameName = Uri.EscapeDataString(split[0].Trim());
                string tagLine = Uri.EscapeDataString(split[1].Trim());

                string url = $"https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}?api_key={apiKey}";

                try
                {
                    HttpResponseMessage response = await client.GetAsync(url);

                    if (response.StatusCode == HttpStatusCode.TooManyRequests)
                    {
                        Console.WriteLine("Rate limit hit. Waiting 5 seconds...");
                        await Task.Delay(5000);
                        response = await client.GetAsync(url);
                    }

                    if (!response.IsSuccessStatusCode)
                    {
                        Console.WriteLine($"Failed to get PUUID for {player.ign}: {response.StatusCode}");
                        continue;
                    }

                    string content = await response.Content.ReadAsStringAsync();
                    var json = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(content);

                    if (json.TryGetProperty("puuid", out JsonElement puuidElement))
                    {
                        player.puuid = puuidElement.GetString() ?? "";
                        File.WriteAllText(filePath, JsonConvert.SerializeObject(players, Formatting.Indented));
                        Console.WriteLine($"Got PUUID for {player.ign}");
                    }
                    else
                    {
                        Console.WriteLine($"No PUUID returned for {player.ign}");
                    }

                    await Task.Delay(300); // safety delay for rate limiting
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error fetching PUUID for {player.ign}: {ex.Message}");
                }
            }

            File.WriteAllText(filePath, JsonConvert.SerializeObject(players, Formatting.Indented));
            Console.WriteLine("All available PUUIDs updated!");
        }


        /* OLD MANUAL VERSION
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