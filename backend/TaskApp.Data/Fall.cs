using System.ComponentModel.DataAnnotations;

namespace TaskApp.Data
{
    public class Fall
    {
        public int Id { get; set; }
        public float latitude { get; set; }
        public float longitude { get; set; }
        public DateTime time_of_fall { get; set; }
    }
}
