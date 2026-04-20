using GameInterfaceHub.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace GameInterfaceHub.Core.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // This property represents the actual table in your database
    public DbSet<Screenshot> Screenshots => Set<Screenshot>();
}