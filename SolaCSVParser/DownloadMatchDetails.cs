using System;
using System.IO;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using SolaCSVParser.Output;
using DotNetEnv;

namespace SolaCSVParser
{
    public static class DownloadMatchDetails
    {
        public static async Task Main()
        {
            DotNetEnv.Env.Load(); // This reads from .env file in the project root
            string? apiKey = Environment.GetEnvironmentVariable("RIOT_API_KEY");

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                Console.WriteLine("Missing Riot API key in .env file.");
                return;
            }

            string playersPath = @"C:\Users\Sola\Documents\GitHub\sdc-s21-scouting\players.json";
            string outputFolder = @"C:\Users\Sola\Documents\GitHub\sdc-s21-scouting\SolaCSVParser\matches";

            if (!File.Exists(playersPath))
            {
                Console.WriteLine("players.json not found.");
                return;
            }

            if (!Directory.Exists(outputFolder))
                Directory.CreateDirectory(outputFolder);

            var players = JsonConvert.DeserializeObject<List<Player>>(File.ReadAllText(playersPath));
            if (players == null)
            {
                Console.WriteLine("Failed to deserialize players.json.");
                return;
            }

            // Collect unique match IDs
            var matchIds = players
                .Where(p => p.gameStats != null)
                .SelectMany(p => p.gameStats!)
                .Select(g => g.matchId)
                .Distinct()
                .ToList();

            Console.WriteLine($"Found {matchIds.Count} unique match IDs.");

            using HttpClient client = new HttpClient();

            int count = 0;
            foreach (var matchId in matchIds)
            {
                string outFile = Path.Combine(outputFolder, $"{matchId}.json");
                if (File.Exists(outFile))
                {
                    Console.WriteLine($"✔ Match {matchId} already exists. Skipping.");
                    continue;
                }

                string url = $"https://americas.api.riotgames.com/lol/match/v5/matches/{matchId}?api_key={apiKey}";

                try
                {
                    Console.WriteLine($"Fetching match: {matchId}");
                    HttpResponseMessage response = await client.GetAsync(url);

                    if (!response.IsSuccessStatusCode)
                    {
                        Console.WriteLine($"Failed for {matchId}: {response.StatusCode}");
                        continue;
                    }

                    string content = await response.Content.ReadAsStringAsync();
                    await File.WriteAllTextAsync(outFile, content);
                    Console.WriteLine($"Saved {matchId} to /matches");

                    count++;

                    if (count % 95 == 0)
                    {
                        Console.WriteLine("Hit 95 requests. Sleeping 2 minutes...");
                        await Task.Delay(TimeSpan.FromMinutes(2));
                    }
                    else
                    {
                        await Task.Delay(300); // small delay between requests
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error fetching {matchId}: {ex.Message}");
                }
            }

            Console.WriteLine($"\nDone! Downloaded {count} match files.");
        }
    }
}
