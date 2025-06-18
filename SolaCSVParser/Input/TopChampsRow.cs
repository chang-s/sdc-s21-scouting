using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SolaCSVParser.Input
{
    public class TopChampsRow
    {
        public required string IGN;
        public required string Champion;
        public required string KDA;
        public required int Wins;
        public required int Losses;
        public required int Total;
        public required string Winrate;
    }
}
