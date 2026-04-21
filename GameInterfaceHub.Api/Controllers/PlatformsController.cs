using GameInterfaceHub.Core.Data;
using GameInterfaceHub.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GameInterfaceHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlatformsController : ControllerBase
{
    private readonly AppDbContext _context;

    public PlatformsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() 
    {
        var platforms = await _context.Platforms.ToListAsync();
    
        // This will print to your terminal logs
        Console.WriteLine($"[API] Platforms requested. Found: {platforms.Count}");
        foreach(var p in platforms) 
        {
            Console.WriteLine($" - ID: {p.Id}, Name: {p.Name}");
        }

        return Ok(platforms);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Platform platform)
    {
        _context.Platforms.Add(platform);
        await _context.SaveChangesAsync();
        return Ok(platform);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var platform = await _context.Platforms.FindAsync(id);
        if (platform == null) return NotFound();
        
        _context.Platforms.Remove(platform);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}