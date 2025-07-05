using SolaCSVParser.Input;
using SolaCSVParser.Output;
using System.Text.Json;


namespace SolaCSVParser
{
    internal class Program
    {
        static void Main(string[] args)
        {
            // Create new json file with players
            // createPlayersJsonFile(args);

            // Add game data
            GetMatchData.Main().GetAwaiter().GetResult();

            // Update IGNs
            // UpdateIGNsByPuuid.Main().GetAwaiter().GetResult();

            // Download batch match details
            // DownloadMatchDetails.Main().GetAwaiter().GetResult();
        }

        public static void createPlayersJsonFile(string[] args)
        {
            CSVParserUtils.ParseFiles(args, out List<TeamsRow> teamsData, out List<PlayersRow> playersData, out List<TopChampsRow> topChampsData);

            Console.WriteLine("Creating player list");
            var players = new List<Player>();

            // Create objects for each player
            foreach (PlayersRow playerRow in playersData)
            {
                Player player = new Player();
                player.ign = playerRow.IGN; // IGN
                player.team = playerRow.Team;
                player.rank = playerRow.Rank;
                player.tier = playerRow.Tier;
                player.points = playerRow.Points;

                var tempRoles = new List<string>();
                tempRoles.Add(playerRow.Role1);
                tempRoles.Add(playerRow.Role2);

                player.roles = tempRoles;
                player.opgg = playerRow.OPGGLink;

                var topChampsCount = 0;

                foreach (TopChampsRow champsRow in topChampsData)
                {
                    if (!champsRow.IGN.Equals(player.ign))
                    {
                        continue;
                    }

                    if (topChampsCount >= 5)
                    {
                        break;
                    }

                    topChampsCount++;
                    var tempChampStats = new ChampionStats();
                    tempChampStats.champion = champsRow.Champion;
                    tempChampStats.games = champsRow.Total;
                    tempChampStats.kda = champsRow.KDA;
                    tempChampStats.winRate = champsRow.Winrate;

                    player.topChamps.Add(tempChampStats.champion);
                    player.champStats.Add(tempChampStats);
                }


                players.Add(player);
            }

            // For each top champ row
            // Look through playersData list for matching player
            // Add top champ row data to that player json object
            Console.WriteLine("Writing players list to SolaData.json");
            string outputFilePath = $"{Directory.GetCurrentDirectory()}\\SolaData.json";
            string jsonString = JsonSerializer.Serialize(players);
            File.WriteAllText(outputFilePath, jsonString);
        }
    }
}
