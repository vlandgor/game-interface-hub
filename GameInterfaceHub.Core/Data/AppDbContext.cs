using GameInterfaceHub.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace GameInterfaceHub.Core.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Screenshot> Screenshots => Set<Screenshot>();
    public DbSet<Platform> Platforms => Set<Platform>();
}