﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SolaCSVParser.Output
{
    public class Participant
    {
        public int assists { get; set; } = -1;
        public string puuid { get; set; } = string.Empty;
        public string championName { get; set; } = string.Empty;
        public string summonerName {  get; set; } = string.Empty;
        public int deaths { get; set; } = -1;
        public int kills { get; set; } = -1;
        public string riotIdGameName { get; set; } = string.Empty;
        public string riotIdTagline { get; set; } = string.Empty;
        public bool win { get; set; } = false;

        public Challenges challenges { get; set; } = new Challenges();
    }
}
