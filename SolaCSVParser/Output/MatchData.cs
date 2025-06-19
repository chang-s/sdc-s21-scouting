using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SolaCSVParser.Output
{
    public class MatchData
    {
        public Metadata metadata { get; set; } = new Metadata();
        public Info info { get; set; } = new Info();
    }
}
