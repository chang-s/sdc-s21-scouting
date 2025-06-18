using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SolaCSVParser.Output
{
    public class ChampionStats
    {
        public string champion { get; set; } = string.Empty;
        public int games { get; set; } = 0;
        public string kda { get; set; } = string.Empty;
        public string winRate { get; set; } = string.Empty;
    }
}
