using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SolaCSVParser.Models
{
    public class Participant
    {
        public int assists { get; set; }
        public string championName { get; set; }
        public int deaths { get; set; }
        public int kills { get; set; }
        public string riotIdGameName { get; set; }
        public string riotIdTagline { get; set; }
        public bool win { get; set; }
    }
}
