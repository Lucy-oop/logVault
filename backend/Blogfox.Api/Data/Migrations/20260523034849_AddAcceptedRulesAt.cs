using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Blogfox.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAcceptedRulesAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AcceptedRulesAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AcceptedRulesAt",
                table: "Users");
        }
    }
}
