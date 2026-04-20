namespace GameInterfaceHub.Core.Models;

public class Screenshot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string GameTitle { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string ImagePath { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public bool IsMobile { get; set; } 
    public List<string> Tags { get; set; } = new();
}