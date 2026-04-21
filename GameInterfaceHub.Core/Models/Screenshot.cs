namespace GameInterfaceHub.Core.Models;

public class Screenshot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string GameTitle { get; set; } = string.Empty;
    
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    
    public int PlatformId { get; set; }
    public Platform? Platform { get; set; }
    
    public int CategoryId { get; set; } // Change this from string Category
    public Category? Category { get; set; }
    
    public string Tags { get; set; } = string.Empty;
}