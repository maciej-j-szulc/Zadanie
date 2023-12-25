using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using TaskApp.Data;
using TaskApp.Models;
using TaskApp.ViewModels;

namespace TaskApp.Controllers
{
    public class HomeController : Controller
    {
        private readonly TaskDataContext context;

        public HomeController(TaskDataContext context)
        {
            this.context = context;
        }

        public IActionResult Index()
        {
            var falls = this.context.Falls.Select(m => new FallViewModel
            {
                latitude = m.latitude,
                longitude = m.longitude,
                time_of_fall = m.time_of_fall
            });
            return View(falls);
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
