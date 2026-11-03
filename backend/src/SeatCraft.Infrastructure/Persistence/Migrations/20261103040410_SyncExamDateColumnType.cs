using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeatCraft.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// Migrations are generated against SQLite, which stores DateOnly as TEXT and
    /// emits no column type. That is harmless locally, but on Postgres the column
    /// lands as text and Npgsql refuses to materialise it into DateOnly.
    ///
    /// The model now declares the column as <c>date</c>, so the snapshot has to say
    /// the same or EF reports pending changes and refuses to start. SQLite needs no
    /// DDL at all, so the conversion only runs on Postgres.
    /// </summary>
    public partial class SyncExamDateColumnType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            if (ActiveProvider?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true)
            {
                migrationBuilder.Sql(
                    "ALTER TABLE exams ALTER COLUMN exam_date TYPE date USING NULLIF(exam_date, '')::date;");
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Deliberately irreversible: reverting to text would break DateOnly reads.
        }
    }
}
