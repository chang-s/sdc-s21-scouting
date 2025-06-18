using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SolaCSVParser.Output
{
    public class Player
    {
        public string ign { get; set; } = string.Empty;
        public string team { get; set; } = string.Empty;
        public string rank { get; set; } = string.Empty;
        public string tier { get; set; } = string.Empty;
        public string points { get; set; } = string.Empty;
        public List<string> roles { get; set; } = new List<string>();
        public string opgg { get; set; } = string.Empty;
        public List<string> topChamps { get; set; } = new List<string>();
        public List<ChampionStats> champStats { get; set; } = new List<ChampionStats>();
        public List<GameStats> gameStats { get; set; } = new List<GameStats>();
        public List<ChampionStatsShort> champsPlayed { get; set; } = new List<ChampionStatsShort>();
        public float avgKDA { get; set; } = 0.0f;
    }
}
