namespace GameInterfaceHub.Core.Interfaces;

public interface IImageService
{
    public Task<string> SaveImageAsync(Stream imageStream, string fileName);
    public void DeleteImage(string filePath);
}