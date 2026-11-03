using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Allocation;
using SeatCraft.Application.Contracts;
using SeatCraft.Application.Exams;
using SeatCraft.Application.Halls;
using SeatCraft.Application.Institutions;
using SeatCraft.Domain.Enums;
using SeatCraft.Domain.ValueObjects;

namespace SeatCraft.Application.Seed;

/// <summary>
/// Builds a realistic demo workspace so a fresh clone has something worth
/// looking at: real-sounding Bangladeshi colleges and student names, several
/// exams in different states, and published seat plans to browse.
/// </summary>
public sealed class DemoSeedService(
    ISeatCraftData data,
    IUnitOfWork unitOfWork,
    ExamService examService,
    InstitutionService institutionService,
    HallService hallService,
    AllocationRunner allocationRunner,
    SeatPlanService seatPlanService,
    ICurrentUser currentUser)
{
    private static readonly string[] MaleNames =
    [
        "Rafi Ahmed", "Tanvir Hasan", "Mehedi Hasan", "Arif Hossain", "Sabbir Rahman",
        "Rakib Hasan", "Shakib Al Hasan", "Hasan Mahmud", "Fahim Shahriar", "Mahin Khan",
        "Zahid Hasan", "Imran Kabir", "Ayan Chowdhury", "Sajid Hossain", "Rubel Mia",
        "Nazmul Islam", "Touhidul Islam", "Ashraful Alam", "Mamun Hossain", "Shahriar Kabir",
        "Rifat Hossain", "Nayeem Ahmed", "Jubayer Hossain", "Sohel Rana", "Anisur Rahman"
    ];

    private static readonly string[] FemaleNames =
    [
        "Nusrat Jahan", "Sumaiya Islam", "Farhana Akter", "Jannatul Ferdous", "Mim Akter",
        "Tasnim Rahman", "Anika Tabassum", "Nabila Sultana", "Sadia Afrin", "Rima Khatun",
        "Priya Das", "Shorna Akter", "Mitu Rani", "Tania Islam", "Laboni Akter",
        "Sanjida Akter", "Rumana Islam", "Faria Tasnim", "Ayesha Siddika", "Marzia Sultana",
        "Sharmin Akter", "Rupali Das", "Nazia Sultana", "Tahmina Akter", "Sultana Razia"
    ];

    private static readonly string[] SubjectGroups = ["Science", "Commerce", "Arts", "Humanities"];

    /// <summary>Real colleges, with the short code used in imports and lookup URLs.</summary>
    private static readonly (string Name, string Code)[] Colleges =
    [
        ("Notre Dame College, Dhaka", "NDC"),
        ("Dhaka College", "DHC"),
        ("Holy Cross College, Tejgaon", "HCC"),
        ("Rajuk Uttara Model College", "RUMC"),
        ("Viqarunnisa Noon College", "VNC"),
        ("Government Tolaram College", "GTC"),
        ("Adamjee Cantonment College", "ACC"),
        ("BAF Shaheen College, Kurmitola", "BSC"),
        ("Government Bangla College, Mirpur", "GBC"),
        ("Titumir College, Dhaka", "TTC"),
        ("Siddheswari Boys' College", "SBC"),
        ("Eden Mohila College", "EMC"),
        ("Chittagong College", "CTC"),
        ("Rajshahi College", "RJC"),
        ("Carmichael College, Rangpur", "CRC"),
        ("Government Azizul Haque College, Bogura", "AHC"),
        ("M C College, Sylhet", "MCC"),
        ("Brojomohun College, Barishal", "BMC"),
        ("Ananda Mohan College, Mymensingh", "AMC"),
        ("Kabi Nazrul Government College", "KNC")
    ];

    private static readonly string[] HallNames =
    [
        "Main Hall", "Academic Building A", "Academic Building B", "Science Block",
        "Exam Hall 1", "Exam Hall 2", "Auditorium", "Library Hall"
    ];

    public async Task<SeedResult> SeedAsync(
        string examTitle = "HSC Admission Test 2026",
        int candidateCount = 500,
        int institutionCount = 20,
        int hallCount = 12,
        int rows = 10,
        int columns = 10,
        CancellationToken cancellationToken = default)
    {
        var institutionIds = await EnsureCollegesAsync(institutionCount, cancellationToken);

        // Three exams in different states, so the dashboard and exam list show
        // more than one row and the planner has something published to open.
        var published = await BuildExamAsync(
            "HSC Admission Test 2026",
            "Session 2026–27, morning shift — published plan",
            candidateCount,
            institutionIds,
            hallCount,
            rows,
            columns,
            publish: true,
            21,
            cancellationToken);

        await BuildExamAsync(
            "Degree Honours Admission 2026",
            "Session 2026–27, afternoon shift — allocated, awaiting review",
            Math.Max(20, candidateCount / 2),
            institutionIds,
            Math.Max(1, hallCount / 2),
            8,
            8,
            publish: false,
            35,
            cancellationToken);

        await BuildExamAsync(
            "Class XI Selection Test 2026",
            "Draft — halls and candidates added, no run yet",
            Math.Max(10, candidateCount / 5),
            institutionIds,
            Math.Max(1, hallCount / 3),
            6,
            6,
            publish: false,
            60,
            cancellationToken,
            allocate: false);

        return new SeedResult(published, candidateCount, institutionIds.Count, hallCount);
    }

    /// <summary>Creates the sample colleges that are not already on the tenant.</summary>
    private async Task<List<Guid>> EnsureCollegesAsync(int count, CancellationToken cancellationToken)
    {
        var existing = data.Institutions.Query()
            .ToList()
            .ToDictionary(institution => institution.Code, institution => institution.Id, StringComparer.OrdinalIgnoreCase);

        var ids = new List<Guid>();

        foreach (var (name, code) in Colleges.Take(Math.Clamp(count, 1, Colleges.Length)))
        {
            if (existing.TryGetValue(code, out var existingId))
            {
                ids.Add(existingId);
                continue;
            }

            var institution = await institutionService.CreateAsync(new CreateInstitutionRequest(name, code), cancellationToken);
            ids.Add(institution.Id);
        }

        return ids;
    }

    private async Task<Guid> BuildExamAsync(
        string title,
        string description,
        int candidateCount,
        List<Guid> institutionIds,
        int hallCount,
        int rows,
        int columns,
        bool publish,
        int daysFromNow,
        CancellationToken cancellationToken,
        bool allocate = true)
    {
        var exam = await examService.CreateAsync(new CreateExamRequest(title, description), cancellationToken);

        // A real date, so admit cards print something meaningful.
        await examService.UpdateAsync(
            exam.Id,
            new UpdateExamRequest(title, description, DateOnly.FromDateTime(DateTime.UtcNow.AddDays(daysFromNow))),
            cancellationToken);

        for (var i = 0; i < Math.Max(1, hallCount); i++)
        {
            var name = i < HallNames.Length ? HallNames[i] : $"Exam Hall {i + 1}";

            await hallService.CreateAsync(exam.Id, new CreateHallRequest(name, rows, columns), cancellationToken);
        }

        var tenantId = currentUser.RequireTenantId();
        var candidates = new List<Domain.Entities.Candidate>(candidateCount);

        for (var i = 0; i < candidateCount; i++)
        {
            // Alternate the name pools so the roster is not one gender in a block.
            var pool = i % 2 == 0 ? MaleNames : FemaleNames;
            var fullName = pool[(i / 2) % pool.Length];

            candidates.Add(Domain.Entities.Candidate.Create(
                tenantId,
                exam.Id,
                institutionIds[i % institutionIds.Count],
                $"R{i + 1:D5}",
                fullName,
                SubjectGroups[i % SubjectGroups.Length],
                new DateOnly(2000, (i % 12) + 1, (i % 28) + 1)));
        }

        await data.Candidates.AddRangeAsync(candidates, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await RefreshInstitutionCountsAsync(institutionIds, cancellationToken);

        if (!allocate)
            return exam.Id;

        // Run the solver inline rather than through the queue: the seed should
        // return a finished workspace, and the queue worker runs in its own scope
        // which would leave this request reading stale, tracked state.
        var seed = Random.Shared.Next(1, int.MaxValue);
        var run = Domain.Entities.AllocationRun.CreateQueued(
            tenantId,
            exam.Id,
            AllocationStrategyKind.Strict,
            seed,
            Guid.NewGuid().ToString("N"));

        await data.AllocationRuns.AddAsync(run, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await allocationRunner.RunAsync(new AllocationJob(tenantId, exam.Id, run.Id, seed), cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        if (publish && run.ResultSeatPlanId is Guid planId)
            await seatPlanService.PublishAsync(exam.Id, planId, cancellationToken);

        return exam.Id;
    }

    private async Task RefreshInstitutionCountsAsync(List<Guid> institutionIds, CancellationToken cancellationToken)
    {
        foreach (var institutionId in institutionIds.Distinct())
        {
            var institution = await data.Institutions.FindAsync(institutionId, cancellationToken);

            if (institution is not null)
                institution.SetCandidateCount(data.Candidates.Query().Count(candidate => candidate.InstitutionId == institutionId));
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

public sealed record SeedResult(Guid ExamId, int Candidates, int Institutions, int Halls);
