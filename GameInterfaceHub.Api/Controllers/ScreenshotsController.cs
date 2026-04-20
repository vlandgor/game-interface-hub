using GameInterfaceHub.Core.Data;
using GameInterfaceHub.Core.Interfaces;
using GameInterfaceHub.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
    public async Task<IActionResult> Upload(
        [FromForm] IFormFile file, 
        [FromForm] int platform, 
        [FromForm] string gameTitle)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file selected.");

        using var stream = file.OpenReadStream();
        var relativePath = await _imageService.SaveImageAsync(stream, file.FileName);

        var screenshotRecord = new Screenshot
        {
            FileName = file.FileName,
            FilePath = relativePath,
            GameTitle = gameTitle ?? "Untitled",
            Category = "UI",
            UploadedAt = DateTime.UtcNow,
            // Cast the integer from the UI (0, 1, 2, 3) to your PlatformType Enum
            Platform = (PlatformType)platform
        };

        _context.Screenshots.Add(screenshotRecord);
        await _context.SaveChangesAsync();

        return Ok(new { path = relativePath, id = screenshotRecord.Id });
    }
    
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? platform)
    {
        var query = _context.Screenshots.AsQueryable();

        // If a platform is specified and it's not 0 (All), filter the results
        if (platform.HasValue && platform.Value != 0)
        {
            query = query.Where(s => (int)s.Platform == platform.Value);
        }

        var screenshots = await query
            .OrderByDescending(s => s.UploadedAt) 
            .ToListAsync();
    
        return Ok(screenshots);
    }
    
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var screenshot = await _context.Screenshots.FindAsync(id);
        if (screenshot == null) return NotFound();

        // 1. Delete the physical file using your service
        _imageService.DeleteImage(screenshot.FilePath);

        // 2. Delete the DB record
        _context.Screenshots.Remove(screenshot);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}