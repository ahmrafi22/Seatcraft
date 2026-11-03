using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using SeatCraft.Domain.Entities;

namespace SeatCraft.Infrastructure.Persistence.Configurations;

public sealed class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.ToTable("tenants");
        builder.HasKey(tenant => tenant.Id);
        builder.Property(tenant => tenant.Name).HasMaxLength(200).IsRequired();
        builder.Property(tenant => tenant.Slug).HasMaxLength(100).IsRequired();
        builder.HasIndex(tenant => tenant.Slug).IsUnique();
    }
}

public sealed class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> builder)
    {
        builder.ToTable("users");
        builder.HasKey(user => user.Id);
        builder.Property(user => user.Email).HasMaxLength(256).IsRequired();
        builder.Property(user => user.PasswordHash).HasMaxLength(512).IsRequired();
        builder.Property(user => user.DisplayName).HasMaxLength(200).IsRequired();
        builder.Property(user => user.Role).HasConversion<string>().HasMaxLength(32);
        builder.HasIndex(user => user.Email).IsUnique();
        builder.HasIndex(user => user.TenantId);
    }
}

public sealed class ExamConfiguration : IEntityTypeConfiguration<Exam>
{
    public void Configure(EntityTypeBuilder<Exam> builder)
    {
        builder.ToTable("exams");
        builder.HasKey(exam => exam.Id);
        builder.Property(exam => exam.Title).HasMaxLength(300).IsRequired();
        builder.Property(exam => exam.Description).HasMaxLength(2000);
        builder.Property(exam => exam.ExamDate).HasColumnName("exam_date");
        builder.Property(exam => exam.Status).HasConversion<string>().HasMaxLength(32);

        builder.OwnsOne(exam => exam.Constraints, constraints =>
        {
            constraints.Property(c => c.PreventSameInstitutionAdjacent).HasColumnName("prevent_same_institution_adjacent");
            constraints.Property(c => c.KeepSubjectGroupContiguous).HasColumnName("keep_subject_group_contiguous");
            constraints.Property(c => c.MaintainRollOrder).HasColumnName("maintain_roll_order");
            constraints.Property(c => c.AllowHallSkipping).HasColumnName("allow_hall_skipping");
        });

        builder.HasIndex(exam => exam.TenantId);
    }
}

public sealed class InstitutionConfiguration : IEntityTypeConfiguration<Institution>
{
    public void Configure(EntityTypeBuilder<Institution> builder)
    {
        builder.ToTable("institutions");
        builder.HasKey(institution => institution.Id);
        builder.Property(institution => institution.Name).HasMaxLength(300).IsRequired();
        builder.Property(institution => institution.Code).HasMaxLength(50).IsRequired();
        builder.HasIndex(institution => new { institution.TenantId, institution.Code }).IsUnique();
    }
}

public sealed class HallConfiguration : IEntityTypeConfiguration<Hall>
{
    public void Configure(EntityTypeBuilder<Hall> builder)
    {
        builder.ToTable("halls");
        builder.HasKey(hall => hall.Id);
        builder.Property(hall => hall.Name).HasMaxLength(200).IsRequired();

        builder.OwnsOne(hall => hall.Layout, layout =>
        {
            layout.Property(l => l.Rows).HasColumnName("rows");
            layout.Property(l => l.Columns).HasColumnName("columns");
        });

        builder.Property(hall => hall.BlockedSeats)
            .HasColumnName("blocked_seats")
            .HasMaxLength(20000)
            .HasConversion(
                seats => SeatPositionListConverter.ToString(seats),
                value => SeatPositionListConverter.FromList(value),
                new ValueComparer<List<Domain.ValueObjects.SeatPosition>>(
                    (left, right) => left!.SequenceEqual(right!),
                    seats => seats.Aggregate(0, (hash, seat) => HashCode.Combine(hash, seat.Row, seat.Column)),
                    seats => seats.ToList()));

        builder.HasIndex(hall => new { hall.ExamId, hall.Name }).IsUnique();
    }
}

public sealed class CandidateConfiguration : IEntityTypeConfiguration<Candidate>
{
    public void Configure(EntityTypeBuilder<Candidate> builder)
    {
        builder.ToTable("candidates");
        builder.HasKey(candidate => candidate.Id);
        builder.Property(candidate => candidate.Roll).HasMaxLength(50).IsRequired();
        builder.Property(candidate => candidate.FullName).HasMaxLength(300).IsRequired();
        builder.Property(candidate => candidate.SubjectGroup).HasMaxLength(100).IsRequired();
        builder.Property(candidate => candidate.PhotoUrl).HasMaxLength(1000);
        builder.Property(candidate => candidate.DateOfBirth);
        builder.HasIndex(candidate => new { candidate.ExamId, candidate.Roll }).IsUnique();
        builder.HasIndex(candidate => candidate.InstitutionId);
    }
}

public sealed class AllocationRunConfiguration : IEntityTypeConfiguration<AllocationRun>
{
    public void Configure(EntityTypeBuilder<AllocationRun> builder)
    {
        builder.ToTable("allocation_runs");
        builder.HasKey(run => run.Id);
        builder.Property(run => run.Strategy).HasConversion<string>().HasMaxLength(32);
        builder.Property(run => run.Status).HasConversion<string>().HasMaxLength(32);
        builder.Property(run => run.IdempotencyKey).HasMaxLength(200).IsRequired();
        builder.Property(run => run.CurrentPhase).HasMaxLength(200);
        builder.Property(run => run.FailureReason).HasMaxLength(1000);
        builder.HasIndex(run => new { run.ExamId, run.IdempotencyKey }).IsUnique();

        // At most one active run per exam, enforced by the database rather than a check-then-insert.
        builder.HasIndex(run => run.ExamId)
            .IsUnique()
            .HasFilter("\"Status\" IN ('Queued', 'Running')")
            .HasDatabaseName("ux_allocation_runs_active_per_exam");
    }
}

public sealed class SeatPlanConfiguration : IEntityTypeConfiguration<SeatPlan>
{
    public void Configure(EntityTypeBuilder<SeatPlan> builder)
    {
        builder.ToTable("seat_plans");
        builder.HasKey(plan => plan.Id);
        builder.Property(plan => plan.Status).HasConversion<string>().HasMaxLength(32);

        builder.OwnsMany(plan => plan.Assignments, assignments =>
        {
            assignments.ToTable("seat_assignments");
            assignments.Property<Guid>("SeatPlanId").HasColumnName("seat_plan_id");
            assignments.WithOwner().HasForeignKey("SeatPlanId");
            assignments.HasKey(assignment => assignment.Id);
            assignments.Property(assignment => assignment.CandidateId).HasColumnName("candidate_id");
            assignments.Property(assignment => assignment.HallId).HasColumnName("hall_id");
            assignments.Property(assignment => assignment.Row).HasColumnName("row");
            assignments.Property(assignment => assignment.Column).HasColumnName("column");
            assignments.HasIndex(assignment => new { assignment.HallId, assignment.Row, assignment.Column });
            assignments.HasIndex(assignment => assignment.CandidateId);
            assignments.Ignore(assignment => assignment.Label);
        });

        builder.HasIndex(plan => plan.ExamId);
    }
}

public sealed class AuditEntryConfiguration : IEntityTypeConfiguration<AuditEntry>
{
    public void Configure(EntityTypeBuilder<AuditEntry> builder)
    {
        builder.ToTable("audit_entries");
        builder.HasKey(entry => entry.Id);
        builder.Property(entry => entry.Action).HasMaxLength(100).IsRequired();
        builder.Property(entry => entry.Detail).HasMaxLength(2000).IsRequired();
        builder.Property(entry => entry.Reason).HasMaxLength(1000);
        builder.HasIndex(entry => new { entry.ExamId, entry.CreatedAt });
    }
}
