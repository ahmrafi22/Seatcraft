using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeatCraft.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "allocation_runs",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    ExamId = table.Column<Guid>(nullable: false),
                    Strategy = table.Column<string>(maxLength: 32, nullable: false),
                    Seed = table.Column<int>(nullable: false),
                    IdempotencyKey = table.Column<string>(maxLength: 200, nullable: false),
                    Status = table.Column<string>(maxLength: 32, nullable: false),
                    ProgressPercent = table.Column<int>(nullable: false),
                    CurrentPhase = table.Column<string>(maxLength: 200, nullable: true),
                    BestViolationCount = table.Column<int>(nullable: false),
                    FailureReason = table.Column<string>(maxLength: 1000, nullable: true),
                    ResultSeatPlanId = table.Column<Guid>(nullable: true),
                    DurationMs = table.Column<long>(nullable: false),
                    CandidateCount = table.Column<int>(nullable: false),
                    HallsUsed = table.Column<int>(nullable: false),
                    CreatedAt = table.Column<long>(nullable: false),
                    UpdatedAt = table.Column<long>(nullable: false),
                    TenantId = table.Column<Guid>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_allocation_runs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "audit_entries",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    ExamId = table.Column<Guid>(nullable: false),
                    ActorUserId = table.Column<Guid>(nullable: true),
                    Action = table.Column<string>(maxLength: 100, nullable: false),
                    Detail = table.Column<string>(maxLength: 2000, nullable: false),
                    IsForced = table.Column<bool>(nullable: false),
                    Reason = table.Column<string>(maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<long>(nullable: false),
                    UpdatedAt = table.Column<long>(nullable: false),
                    TenantId = table.Column<Guid>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_entries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "candidates",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    ExamId = table.Column<Guid>(nullable: false),
                    InstitutionId = table.Column<Guid>(nullable: false),
                    Roll = table.Column<string>(maxLength: 50, nullable: false),
                    FullName = table.Column<string>(maxLength: 300, nullable: false),
                    SubjectGroup = table.Column<string>(maxLength: 100, nullable: false),
                    DateOfBirth = table.Column<DateOnly>(nullable: true),
                    PhotoUrl = table.Column<string>(maxLength: 1000, nullable: true),
                    IsSeatLocked = table.Column<bool>(nullable: false),
                    CreatedAt = table.Column<long>(nullable: false),
                    UpdatedAt = table.Column<long>(nullable: false),
                    TenantId = table.Column<Guid>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_candidates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "exams",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    Title = table.Column<string>(maxLength: 300, nullable: false),
                    Description = table.Column<string>(maxLength: 2000, nullable: true),
                    Status = table.Column<string>(maxLength: 32, nullable: false),
                    prevent_same_institution_adjacent = table.Column<bool>(nullable: false),
                    keep_subject_group_contiguous = table.Column<bool>(nullable: false),
                    maintain_roll_order = table.Column<bool>(nullable: false),
                    allow_hall_skipping = table.Column<bool>(nullable: false),
                    ActiveSeatPlanId = table.Column<Guid>(nullable: true),
                    CreatedAt = table.Column<long>(nullable: false),
                    UpdatedAt = table.Column<long>(nullable: false),
                    TenantId = table.Column<Guid>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_exams", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "halls",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    ExamId = table.Column<Guid>(nullable: false),
                    Name = table.Column<string>(maxLength: 200, nullable: false),
                    rows = table.Column<int>(nullable: false),
                    columns = table.Column<int>(nullable: false),
                    CapacityOverride = table.Column<int>(nullable: true),
                    blocked_seats = table.Column<string>(maxLength: 20000, nullable: false),
                    CreatedAt = table.Column<long>(nullable: false),
                    UpdatedAt = table.Column<long>(nullable: false),
                    TenantId = table.Column<Guid>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_halls", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "institutions",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    Name = table.Column<string>(maxLength: 300, nullable: false),
                    Code = table.Column<string>(maxLength: 50, nullable: false),
                    CandidateCount = table.Column<int>(nullable: false),
                    CreatedAt = table.Column<long>(nullable: false),
                    UpdatedAt = table.Column<long>(nullable: false),
                    TenantId = table.Column<Guid>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_institutions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "seat_plans",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    ExamId = table.Column<Guid>(nullable: false),
                    AllocationRunId = table.Column<Guid>(nullable: false),
                    Status = table.Column<string>(maxLength: 32, nullable: false),
                    ViolationCount = table.Column<int>(nullable: false),
                    PublishedAt = table.Column<long>(nullable: true),
                    CreatedAt = table.Column<long>(nullable: false),
                    UpdatedAt = table.Column<long>(nullable: false),
                    TenantId = table.Column<Guid>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_seat_plans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tenants",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    Name = table.Column<string>(maxLength: 200, nullable: false),
                    Slug = table.Column<string>(maxLength: 100, nullable: false),
                    CreatedAt = table.Column<long>(nullable: false),
                    UpdatedAt = table.Column<long>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tenants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    Email = table.Column<string>(maxLength: 256, nullable: false),
                    PasswordHash = table.Column<string>(maxLength: 512, nullable: false),
                    DisplayName = table.Column<string>(maxLength: 200, nullable: false),
                    Role = table.Column<string>(maxLength: 32, nullable: false),
                    IsActive = table.Column<bool>(nullable: false),
                    CreatedAt = table.Column<long>(nullable: false),
                    UpdatedAt = table.Column<long>(nullable: false),
                    TenantId = table.Column<Guid>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "seat_assignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    seat_plan_id = table.Column<Guid>(nullable: false),
                    candidate_id = table.Column<Guid>(nullable: false),
                    hall_id = table.Column<Guid>(nullable: false),
                    row = table.Column<int>(nullable: false),
                    column = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_seat_assignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_seat_assignments_seat_plans_seat_plan_id",
                        column: x => x.seat_plan_id,
                        principalTable: "seat_plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_allocation_runs_ExamId_IdempotencyKey",
                table: "allocation_runs",
                columns: new[] { "ExamId", "IdempotencyKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ux_allocation_runs_active_per_exam",
                table: "allocation_runs",
                column: "ExamId",
                unique: true,
                filter: "\"Status\" IN ('Queued', 'Running')");

            migrationBuilder.CreateIndex(
                name: "IX_audit_entries_ExamId_CreatedAt",
                table: "audit_entries",
                columns: new[] { "ExamId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_candidates_ExamId_Roll",
                table: "candidates",
                columns: new[] { "ExamId", "Roll" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_candidates_InstitutionId",
                table: "candidates",
                column: "InstitutionId");

            migrationBuilder.CreateIndex(
                name: "IX_exams_TenantId",
                table: "exams",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_halls_ExamId_Name",
                table: "halls",
                columns: new[] { "ExamId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_institutions_TenantId_Code",
                table: "institutions",
                columns: new[] { "TenantId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_seat_assignments_candidate_id",
                table: "seat_assignments",
                column: "candidate_id");

            migrationBuilder.CreateIndex(
                name: "IX_seat_assignments_hall_id_row_column",
                table: "seat_assignments",
                columns: new[] { "hall_id", "row", "column" });

            migrationBuilder.CreateIndex(
                name: "IX_seat_assignments_seat_plan_id",
                table: "seat_assignments",
                column: "seat_plan_id");

            migrationBuilder.CreateIndex(
                name: "IX_seat_plans_ExamId",
                table: "seat_plans",
                column: "ExamId");

            migrationBuilder.CreateIndex(
                name: "IX_tenants_Slug",
                table: "tenants",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_Email",
                table: "users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_TenantId",
                table: "users",
                column: "TenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "allocation_runs");

            migrationBuilder.DropTable(
                name: "audit_entries");

            migrationBuilder.DropTable(
                name: "candidates");

            migrationBuilder.DropTable(
                name: "exams");

            migrationBuilder.DropTable(
                name: "halls");

            migrationBuilder.DropTable(
                name: "institutions");

            migrationBuilder.DropTable(
                name: "seat_assignments");

            migrationBuilder.DropTable(
                name: "tenants");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "seat_plans");
        }
    }
}
