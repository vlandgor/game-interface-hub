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
        [FromForm] int categoryId,
        [FromForm] string gameTitle)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file selected.");

        var platformExists = await _context.Platforms.AnyAsync(p => p.Id == platformId);
        if (!platformExists)
            return BadRequest("Invalid Platform ID.");
        
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == categoryId);
        if (!categoryExists) 
            return BadRequest("Invalid Category ID.");

        using var stream = file.OpenReadStream();
        var relativePath = await _imageService.SaveImageAsync(stream, file.FileName);

        var screenshotRecord = new Screenshot
        {
            FileName = file.FileName,
            FilePath = relativePath,
            GameTitle = gameTitle ?? "Untitled",
            UploadedAt = DateTime.UtcNow,
            PlatformId = platformId,
            CategoryId = categoryId
        };

        _context.Screenshots.Add(screenshotRecord);
        await _context.SaveChangesAsync();

        return Ok(new { path = relativePath, id = screenshotRecord.Id });
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