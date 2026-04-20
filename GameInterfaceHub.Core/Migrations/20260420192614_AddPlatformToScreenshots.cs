using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GameInterfaceHub.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddPlatformToScreenshots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IsMobile",
                table: "Screenshots",
                newName: "Platform");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Platform",
                table: "Screenshots",
                newName: "IsMobile");
        }
    }
}
