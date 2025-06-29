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
            string apiKey = "RGAPI-316c67ad-3dce-4bbe-b608-8f557ed7dfb4";  // Replace with your key
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

            foreach (var player in players)
            {
                if (string.IsNullOrEmpty(player.puuid))
                {
                    Console.WriteLine($"Skipping {player.ign}: no puuid found.");
                    continue;
                }

                string url = $"https://americas.api.riotgames.com/riot/account/v1/accounts/by-puuid/{player.puuid}?api_key={apiKey}";

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
                        Console.WriteLine($"❌ Failed to get Riot ID for {player.ign}: {response.StatusCode}");
                        continue;
                    }

                    string content = await response.Content.ReadAsStringAsync();
                    var json = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(content);

                    string gameName = json.GetProperty("gameName").GetString() ?? "";
                    string tagLine = json.GetProperty("tagLine").GetString() ?? "";

                    string updatedIGN = $"{gameName}#{tagLine}";

                    Console.WriteLine($"✅ Updated IGN for {player.ign} → {updatedIGN}");
                    player.ign = updatedIGN;

                    // Optional: update op.gg link too
                    string urlFriendlyIGN = $"{gameName}-{tagLine}".ToLower();
                    player.opgg = $"https://op.gg/lol/summoners/na/{urlFriendlyIGN}";

                    await Task.Delay(300); // rate limit buffer
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"⚠️ Error for {player.ign}: {ex.Message}");
                }
            }

            File.WriteAllText(filePath, JsonConvert.SerializeObject(players, Formatting.Indented));
            Console.WriteLine("\n✨ All IGN values updated and saved to players.json!");
        }
    }
}
