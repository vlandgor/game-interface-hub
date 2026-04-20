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
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] int platform)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file selected.");

        using var stream = file.OpenReadStream();
        var relativePath = await _imageService.SaveImageAsync(stream, file.FileName);

        var screenshotRecord = new Screenshot
        {
            FileName = file.FileName,
            FilePath = relativePath,
            GameTitle = "New Prototype", 
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
    public async Task<IActionResult> GetAll()
    {
        // You must explicitly tell it to use 's => s.UploadedAt'
        var screenshots = await _context.Screenshots
            .OrderByDescending(s => s.UploadedAt) 
            .ToListAsync();
        
        return Ok(screenshots);
    }
}