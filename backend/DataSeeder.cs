using TaskApp.Data;

namespace TaskApp
{
    public static class DataSeeder
    {
        public static void Seed(this IHost host)
        {
            using var scope = host.Services.CreateScope();
            using var context = scope.ServiceProvider.GetRequiredService<TaskDataContext>();
            context.Database.EnsureCreated();
            AddFalls(context);
        }

        private static void AddFalls(TaskDataContext context)
        {
            var fall = context.Falls.FirstOrDefault();
            if (fall != null) return;

            context.Falls.Add(new Fall
            {
                latitude = 8,
                longitude = 8,
                time_of_fall = DateTime.UtcNow
            });

            context.SaveChanges();
        }
    }
}
