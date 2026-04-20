using GameInterfaceHub.Core.Data;
using GameInterfaceHub.Core.Interfaces;
using GameInterfaceHub.Core.Models;
using Microsoft.AspNetCore.Mvc;

namespace GameInterfaceHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScreenshotsController : ControllerBase
{
    private readonly IImageService _imageService;
    private readonly AppDbContext _context;

    // The API project "injects" the service here automatically
    public ScreenshotsController(IImageService imageService, AppDbContext context)
    {
        _imageService = imageService;
        _context = context;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file selected.");

        using var stream = file.OpenReadStream();
        var relativePath = await _imageService.SaveImageAsync(stream, file.FileName);

        // --- NEW: Save the metadata to the Database ---
        var screenshotRecord = new Screenshot
        {
            FileName = file.FileName,
            FilePath = relativePath,
            GameTitle = "Unknown", // We can add a field to the UI later for this
            Category = "UI",
            UploadedAt = DateTime.UtcNow
        };

        _context.Screenshots.Add(screenshotRecord);
        await _context.SaveChangesAsync();
        // ----------------------------------------------

        return Ok(new { path = relativePath, id = screenshotRecord.Id });
    }
}