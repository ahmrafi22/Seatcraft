namespace SeatCraft.Domain.Solver;

/// <summary>
/// Mutable working state for a single allocation attempt. Keeps the grid, the
/// remaining demand per institution and the slot/candidate mapping in sync.
/// </summary>
internal sealed class AllocationState
{
    private readonly SeatGrid _grid;
    private readonly SolverInput _input;
    private readonly Dictionary<Guid, int> _institutionIndex = [];
    private readonly Queue<int>[] _pendingByInstitution;
    private readonly int[] _remainingByInstitution;
    private readonly int[] _rollRank;

    public AllocationState(SolverInput input, SeatGrid grid)
    {
        _grid = grid;
        _input = input;

        var institutions = input.Candidates
            .Select(c => c.InstitutionId)
            .Distinct()
            .OrderBy(id => id)
            .ToList();

        for (var i = 0; i < institutions.Count; i++)
            _institutionIndex[institutions[i]] = i;

        _remainingByInstitution = new int[institutions.Count];
        _pendingByInstitution = new Queue<int>[institutions.Count];

        for (var i = 0; i < institutions.Count; i++)
            _pendingByInstitution[i] = new Queue<int>();

        var rollOrder = Enumerable.Range(0, input.Candidates.Count)
            .OrderBy(i => input.Candidates[i].Roll, StringComparer.Ordinal)
            .ToList();

        _rollRank = new int[input.Candidates.Count];

        for (var rank = 0; rank < rollOrder.Count; rank++)
        {
            var candidateIndex = rollOrder[rank];
            _rollRank[candidateIndex] = rank;

            var institution = _institutionIndex[input.Candidates[candidateIndex].InstitutionId];
            _pendingByInstitution[institution].Enqueue(candidateIndex);
            _remainingByInstitution[institution]++;
        }

        SlotByCandidate = Enumerable.Repeat(-1, input.Candidates.Count).ToArray();
        CandidateBySlot = Enumerable.Repeat(-1, grid.Count).ToArray();
        InstitutionBySlot = Enumerable.Repeat(-1, grid.Count).ToArray();
    }

    public int[] SlotByCandidate { get; }

    public int[] CandidateBySlot { get; }

    public int[] InstitutionBySlot { get; }

    public int InstitutionCount => _remainingByInstitution.Length;

    public int Remaining(int institution) => _remainingByInstitution[institution];

    public int InstitutionOfCandidate(int candidateIndex) =>
        _institutionIndex[_input.Candidates[candidateIndex].InstitutionId];

    public bool HasPending(int institution) => _pendingByInstitution[institution].Count > 0;

    public int PeekNextCandidate(int institution) =>
        _pendingByInstitution[institution].Count > 0 ? _pendingByInstitution[institution].Peek() : -1;

    public IReadOnlyList<int> NeighborInstitutions(int slot)
    {
        var neighbors = _grid.NeighborsOf(slot);
        var result = new List<int>(neighbors.Count);

        foreach (var neighbor in neighbors)
        {
            var institution = InstitutionBySlot[neighbor];
            if (institution >= 0)
                result.Add(institution);
        }

        return result;
    }

    public bool ConflictsWithNeighbors(int slot, int institution)
    {
        foreach (var neighbor in _grid.NeighborsOf(slot))
        {
            if (InstitutionBySlot[neighbor] == institution)
                return true;
        }

        return false;
    }

    /// <summary>Number of occupied neighbours belonging to <paramref name="institution"/>.</summary>
    public int NeighborCountOf(int slot, int institution)
    {
        var count = 0;

        foreach (var neighbor in _grid.NeighborsOf(slot))
        {
            if (InstitutionBySlot[neighbor] == institution)
                count++;
        }

        return count;
    }

    public void Assign(int slot, int candidateIndex, int institution)
    {
        SlotByCandidate[candidateIndex] = slot;
        CandidateBySlot[slot] = candidateIndex;
        InstitutionBySlot[slot] = institution;
        _remainingByInstitution[institution]--;
        _pendingByInstitution[institution].Dequeue();
    }

    /// <summary>Places a candidate without consuming the pending queue (used when rebuilding state).</summary>
    public void ForceAssign(int slot, int candidateIndex, int institution)
    {
        SlotByCandidate[candidateIndex] = slot;
        CandidateBySlot[slot] = candidateIndex;
        InstitutionBySlot[slot] = institution;
        _remainingByInstitution[institution]--;

        var pending = _pendingByInstitution[institution].ToList();
        pending.Remove(candidateIndex);
        _pendingByInstitution[institution] = new Queue<int>(pending);
    }

    public void Unassign(int slot)
    {
        var candidateIndex = CandidateBySlot[slot];
        if (candidateIndex < 0)
            return;

        var institution = InstitutionBySlot[slot];
        SlotByCandidate[candidateIndex] = -1;
        CandidateBySlot[slot] = -1;
        InstitutionBySlot[slot] = -1;
        _remainingByInstitution[institution]++;
        _pendingByInstitution[institution] = Requeue(_pendingByInstitution[institution], candidateIndex);
    }

    /// <summary>Swaps the occupants of two slots. Returns false when either slot is empty.</summary>
    public bool Swap(int slotA, int slotB)
    {
        var candidateA = CandidateBySlot[slotA];
        var candidateB = CandidateBySlot[slotB];

        if (candidateA < 0 || candidateB < 0)
            return false;

        var institutionA = InstitutionBySlot[slotA];
        var institutionB = InstitutionBySlot[slotB];

        CandidateBySlot[slotA] = candidateB;
        CandidateBySlot[slotB] = candidateA;
        InstitutionBySlot[slotA] = institutionB;
        InstitutionBySlot[slotB] = institutionA;
        SlotByCandidate[candidateA] = slotB;
        SlotByCandidate[candidateB] = slotA;
        return true;
    }

    public int AdjacentConflictCount(int slot)
    {
        var institution = InstitutionBySlot[slot];
        if (institution < 0)
            return 0;

        var count = 0;
        foreach (var neighbor in _grid.NeighborsOf(slot))
        {
            if (InstitutionBySlot[neighbor] == institution)
                count++;
        }

        return count;
    }

    public int TotalAdjacentConflicts()
    {
        var total = 0;

        for (var slot = 0; slot < _grid.Count; slot++)
        {
            var institution = InstitutionBySlot[slot];
            if (institution < 0)
                continue;

            foreach (var neighbor in _grid.NeighborsOf(slot))
            {
                if (neighbor > slot && InstitutionBySlot[neighbor] == institution)
                    total++;
            }
        }

        return total;
    }

    public int AssignedCount => SlotByCandidate.Count(slot => slot >= 0);

    /// <summary>Institutions still holding candidates, largest demand first (DSATUR-style ordering).</summary>
    public IReadOnlyList<int> InstitutionsByRemainingDescending() =>
        Enumerable.Range(0, _remainingByInstitution.Length)
            .Where(HasPending)
            .OrderByDescending(Remaining)
            .ThenBy(PeekNextCandidate)
            .ToArray();

    private Queue<int> Requeue(Queue<int> queue, int candidateIndex)
    {
        var items = queue.ToList();
        var insertAt = items.FindIndex(existing => _rollRank[existing] > _rollRank[candidateIndex]);
        items.Insert(insertAt < 0 ? items.Count : insertAt, candidateIndex);
        return new Queue<int>(items);
    }
}
