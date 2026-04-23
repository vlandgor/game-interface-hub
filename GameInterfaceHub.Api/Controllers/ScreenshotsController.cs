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

    public ScreenshotsController(IImageService imageService, AppDbContext context)
    {
        _imageService = imageService;
        _context = context;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(
        [FromForm] IFormFile file, 
        [FromForm] int platformId, 
        [FromForm] string tags, // Received as "minimalist, sci-fi, hud"
        [FromForm] string gameTitle)
    {
        if (file == null || file.Length == 0) return BadRequest();

        using var stream = file.OpenReadStream();
        var relativePath = await _imageService.SaveImageAsync(stream, file.FileName);

        var screenshotRecord = new Screenshot
        {
            FilePath = relativePath,
            GameTitle = gameTitle ?? "Untitled",
            PlatformId = platformId,
            Tags = tags?.ToLower() ?? "" // Store cleaned tags
        };

        _context.Screenshots.Add(screenshotRecord);
        await _context.SaveChangesAsync();
        return Ok(new { id = screenshotRecord.Id });
    }
    
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? platformId)
    {
        var query = _context.Screenshots.Include(s => s.Platform).AsQueryable();

        if (platformId.HasValue && platformId.Value != 0)
        {
            query = query.Where(s => s.PlatformId == platformId.Value);
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

        _imageService.DeleteImage(screenshot.FilePath);
        _context.Screenshots.Remove(screenshot);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}