﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SolaCSVParser.Output
{
    public class GameStats
    {
        public string ign { get; set; } = string.Empty;
        public string matchId { get; set; } = string.Empty;
        public string date { get; set; } = string.Empty;
        public string champion { get; set; } = string.Empty;
        public string k { get; set; } = string.Empty;
        public string d { get; set; } = string.Empty;
        public string a { get; set; } = string.Empty;
        public float kda { get; set; } = 0;
        public string result { get; set; } = string.Empty;
        public string vs { get; set; } = string.Empty;
        public string vsAbbr { get; set; } = string.Empty;
    }
}
