using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeatCraft.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddExamDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "exam_date",
                table: "exams",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "exam_date",
                table: "exams");
        }
    }
}
