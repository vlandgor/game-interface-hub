using GameInterfaceHub.Core.Interfaces;

namespace GameInterfaceHub.Core.Services;

public class LocalImageService : IImageService
{
    private readonly string _storagePath;
    
    public LocalImageService()
    {
        _storagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");

        if (!Directory.Exists(_storagePath))
        {
            Directory.CreateDirectory(_storagePath);
        }
    }
    
    public async Task<string> SaveImageAsync(Stream imageStream, string fileName)
    {
        var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
        var fullPath = Path.Combine(_storagePath, uniqueFileName);

        using var fileStream = new FileStream(fullPath, FileMode.Create);
        await imageStream.CopyToAsync(fileStream);

        return Path.Combine("uploads", uniqueFileName);
    }
    
    public void DeleteImage(string filePath)
    {
        var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", filePath);
        if (File.Exists(fullPath)) File.Delete(fullPath);
    }
}