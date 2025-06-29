using System.Net;
using System.Net.Http;
using System.Text.Json;
using Newtonsoft.Json;
using SolaCSVParser.Output;

namespace SolaCSVParser
{
    public static class UpdateIGNsByPuuid
    {
        public static async Task Main()
        {
            string apiKey = "RGAPI-316c67ad-3dce-4bbe-b608-8f557ed7dfb4";
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

            using HttpClient client = new HttpClient();
            int updatedCount = 0;
            int requestCount = 0;

            Console.WriteLine("Checking for updated IGNs...");

            for (int i = 0; i < players.Count; i++)
            {
                var player = players[i];

                if (string.IsNullOrEmpty(player.puuid))
                    continue;

                string url = $"https://americas.api.riotgames.com/riot/account/v1/accounts/by-puuid/{player.puuid}?api_key={apiKey}";
                JsonElement json = default;

                while (true)
                {
                    try
                    {
                        HttpResponseMessage response = await client.GetAsync(url);

                        if (response.StatusCode == HttpStatusCode.TooManyRequests)
                        {
                            Console.WriteLine("Rate limit hit. Waiting 20 seconds...");
                            await Task.Delay(20000);
                            continue;
                        }

                        if (!response.IsSuccessStatusCode)
                        {
                            Console.WriteLine($"Failed to get Riot ID for {player.ign}: {response.StatusCode}");
                            break;
                        }

                        string content = await response.Content.ReadAsStringAsync();
                        json = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(content);
                        requestCount++;
                        if (requestCount >= 100)
                        {
                            Console.WriteLine("Hit 100 requests. Sleeping for 2 minutes to respect Riot API rate limits...");
                            await Task.Delay(TimeSpan.FromMinutes(2));
                            requestCount = 0;
                        }
                        break; // Success
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error for {player.ign}: {ex.Message}");
                        break;
                    }
                }

                if (json.ValueKind == JsonValueKind.Undefined)
                    continue;

                string gameName = json.GetProperty("gameName").GetString() ?? "";
                string tagLine = json.GetProperty("tagLine").GetString() ?? "";
                string updatedIGN = $"{gameName}#{tagLine}";

                if (player.ign != updatedIGN)
                {
                    Console.WriteLine($"IGN updated: {player.ign} => {updatedIGN}");
                    player.ign = updatedIGN;

                    // Encode game name for proper URL formatting
                    string encodedGameName = Uri.EscapeDataString(gameName);
                    string urlFriendly = $"{encodedGameName}-{tagLine}".ToLower();
                    player.opgg = $"https://op.gg/lol/summoners/na/{urlFriendly}";

                    updatedCount++;

                    // Save immediately to preserve progress
                    File.WriteAllText(filePath, JsonConvert.SerializeObject(players, Formatting.Indented));
                }

                await Task.Delay(300); // Respect Riot API rate limits
            }

            Console.WriteLine($"\nDone! {updatedCount} IGN(s) updated and saved to players.json.");
        }
    }
}
