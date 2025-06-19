using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Newtonsoft.Json;
using SolaCSVParser.Models;

namespace SolaCSVParser
{
    public static class GetMatchData
    {

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

                MatchData match = System.Text.Json.JsonSerializer.Deserialize<MatchData>(content, options);

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