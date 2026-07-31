namespace FormationsTimer.UI.Domain;

public static class FormationTimerTimeline
{
    public static IReadOnlyList<CheckpointDefinition> Checkpoints { get; } =
    [
        new(CheckpointType.StartRehearsal, false),
        new(CheckpointType.EnterFloor, false),
        new(CheckpointType.MusicStart, true, SegmentType.MarchOn),
        new(CheckpointType.MainSectionStart, true, SegmentType.Entry),
        new(CheckpointType.MainSectionEnd, true, SegmentType.MainSection),
        new(CheckpointType.MusicEnd, true, SegmentType.Exit),
        new(CheckpointType.LeaveFloor, true, SegmentType.WalkOff),
        new(CheckpointType.EndRehearsal, false)
    ];

    private static readonly IReadOnlyDictionary<CheckpointType, int> CheckpointIndexes =
        Checkpoints
            .Select((checkpoint, index) => new { checkpoint.Type, index })
            .ToDictionary(item => item.Type, item => item.index);

    public static int Count => Checkpoints.Count;

    public static CheckpointDefinition FirstCheckpoint => Checkpoints[0];

    public static CheckpointDefinition GetCheckpointAt(int index)
    {
        return Checkpoints[index];
    }

    public static int GetIndex(CheckpointType type)
    {
        return CheckpointIndexes[type];
    }

    public static CheckpointDefinition GetNextCheckpoint(int capturedCheckpointCount)
    {
        return Checkpoints[capturedCheckpointCount];
    }
}
