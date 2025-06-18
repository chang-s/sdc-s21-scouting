using System.Reflection;

namespace SolaCSVParser.Input
{
    public static class CSVParserUtils
    {
        public static void ParseFiles(string[] args, out List<TeamsRow> teamsData, out List<PlayersRow> playersData, out List<TopChampsRow> topChampsData)
        {
            teamsData = new List<TeamsRow>();
            playersData = new List<PlayersRow>();
            topChampsData = new List<TopChampsRow>();

            foreach (string arg in args)
            {
                Console.WriteLine($"Reading arg:{arg}");
                if (!File.Exists(arg))
                {
                    Console.WriteLine($"Cannot find file:{arg}");
                    continue;
                }

                if (arg.Contains("Teams"))
                {
                    Console.WriteLine("Parsing file as Teams");
                    string[] lines = File.ReadAllLines(arg);
                    if (lines.Length <= 1)
                    {
                        Console.WriteLine("This table is weird");
                        continue;
                    }
                    
                    PropertyInfo[] properties = typeof(TeamsRow).GetProperties();
                    for (int i = 1; i < lines.Length; i++)
                    {
                        string[] lineData = lines[i].Split(",");
                        if (lineData.Length != properties.Length)
                        {
                            Console.WriteLine("This row is weird");
                            continue;
                        }
                        teamsData.Add(new TeamsRow()
                        {
                            TeamID = int.Parse(lineData[0]),
                            TeamName = lineData[1],
                            Captain = lineData[2],
                            ShortName = lineData[3],
                        });
                    }
                    continue;
                }

                if (arg.Contains("Players"))
                {
                    Console.WriteLine("Parsing file as Players");
                    string[] lines = File.ReadAllLines(arg);
                    if (lines.Length <= 1)
                    {
                        Console.WriteLine("This table is weird");
                        continue;
                    }
                    
                    PropertyInfo[] properties = typeof(PlayersRow).GetProperties();
                    for (int i = 1; i < lines.Length; i++)
                    {
                        string[] lineData = lines[i].Split(",");
                        if (lineData.Length != properties.Length)
                        {
                            Console.WriteLine("This row is weird");
                            continue;
                        }
                        playersData.Add(new PlayersRow()
                        {
                            IGN = lineData[0],
                            Team = lineData[1],
                            Tier = lineData[2],
                            Points = lineData[3],
                            Rank = lineData[4],
                            Role1 = lineData[5],
                            Role2 = lineData[6],
                            OPGGLink = lineData[7],
                        });
                    }
                    continue;
                }

                if (arg.Contains("Top Champs"))
                {
                    Console.WriteLine("Parsing file as Top Champs");
                    string[] lines = File.ReadAllLines(arg);
                    if (lines.Length <= 1)
                    {
                        Console.WriteLine("This table is weird");
                        continue;
                    }
                    PropertyInfo[] properties = typeof(TopChampsRow).GetProperties();
                    for (int i = 1; i < lines.Length; i++)
                    {
                        string[] lineData = lines[i].Split(",");
                        if (lineData.Length != properties.Length)
                        {
                            Console.WriteLine("This row is weird");
                            continue;
                        }
                        topChampsData.Add(new TopChampsRow()
                        {
                            IGN = lineData[0],
                            Champion = lineData[1],
                            KDA = lineData[2],
                            Wins = int.Parse(lineData[3]),
                            Losses = int.Parse(lineData[4]),
                            Total = int.Parse(lineData[5]),
                            Winrate = lineData[6],
                        });
                    }
                    continue;
                }
            }
        }
    }
}
