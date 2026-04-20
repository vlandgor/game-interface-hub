using GameInterfaceHub.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GameInterfaceHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScreenshotsController : ControllerBase
{
    private readonly IImageService _imageService;

    // The API project "injects" the service here automatically
    public ScreenshotsController(IImageService imageService)
    {
        _imageService = imageService;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file selected.");

        // Open the stream from the uploaded file
        using var stream = file.OpenReadStream();
        
        // Save it using our Core service
        var relativePath = await _imageService.SaveImageAsync(stream, file.FileName);

        // Return a 200 OK with the path where the file is stored
        return Ok(new { path = relativePath });
    }
}