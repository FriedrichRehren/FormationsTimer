using FormationsTimer.UI.Domain;

namespace FormationsTimer.UI.Localization;

public static class FormationTimerText
{
    public static string GetCheckpointName(CheckpointType type)
    {
        return type switch
        {
            CheckpointType.StartRehearsal => AppStrings.CheckpointStartRehearsal,
            CheckpointType.EnterFloor => AppStrings.CheckpointEnterFloor,
            CheckpointType.MusicStart => AppStrings.CheckpointMusicStart,
            CheckpointType.MainSectionStart => AppStrings.CheckpointMainSectionStart,
            CheckpointType.MainSectionEnd => AppStrings.CheckpointMainSectionEnd,
            CheckpointType.MusicEnd => AppStrings.CheckpointMusicEnd,
            CheckpointType.LeaveFloor => AppStrings.CheckpointLeaveFloor,
            CheckpointType.EndRehearsal => AppStrings.CheckpointEndRehearsal,
            _ => throw new ArgumentOutOfRangeException(nameof(type), type, null)
        };
    }

    public static string GetSegmentName(SegmentType type)
    {
        return type switch
        {
            SegmentType.MarchOn => AppStrings.SegmentMarchOn,
            SegmentType.Entry => AppStrings.SegmentEntry,
            SegmentType.MainSection => AppStrings.SegmentMainSection,
            SegmentType.Exit => AppStrings.SegmentExit,
            SegmentType.WalkOff => AppStrings.SegmentWalkOff,
            _ => throw new ArgumentOutOfRangeException(nameof(type), type, null)
        };
    }
}
