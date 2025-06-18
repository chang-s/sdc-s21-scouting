namespace SolaCSVParser.Input
{
    public class TopChampsRow
    {
        public required string IGN { get; set; }
        public required string Champion { get; set; }
        public required string KDA { get; set; }
        public required int Wins { get; set; }
        public required int Losses { get; set; }
        public required int Total { get; set; }
        public required string Winrate { get; set; }
    }
}
