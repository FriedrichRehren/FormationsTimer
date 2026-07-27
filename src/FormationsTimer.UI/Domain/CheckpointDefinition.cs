namespace FormationsTimer.UI.Domain;

public sealed record CheckpointDefinition(
    CheckpointType Type,
    bool IsStepLimitConfigurable,
    SegmentType? ActiveSegmentBefore = null);
