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
    ///
    /// The conversion is guarded because a database that was repaired by hand may
    /// already hold a real date column, and casting date -> text -> date fails.
    /// </summary>
    public partial class SyncExamDateColumnType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            if (ActiveProvider?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true)
            {
                migrationBuilder.Sql(
                    """
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1
                            FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'exams'
                              AND column_name = 'exam_date'
                              AND data_type <> 'date'
                        ) THEN
                            ALTER TABLE exams
                                ALTER COLUMN exam_date TYPE date
                                USING NULLIF(exam_date, '')::date;
                        END IF;
                    END $$;
                    """);
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Deliberately irreversible: reverting to text would break DateOnly reads.
        }
    }
}
