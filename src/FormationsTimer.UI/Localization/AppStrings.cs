using System.Globalization;
using System.Resources;

namespace FormationsTimer.UI.Localization;

public static class AppStrings
{
    private static readonly ResourceManager ResourceManager = new(
        "FormationsTimer.UI.Resources.Localization.AppStrings",
        typeof(AppStrings).Assembly);

    public static string AppTitle => Get(nameof(AppTitle));
    public static string HomeTabTitle => Get(nameof(HomeTabTitle));
    public static string SettingsTabTitle => Get(nameof(SettingsTabTitle));
    public static string HomeHeaderTitle => Get(nameof(HomeHeaderTitle));
    public static string HomeDurationLabel => Get(nameof(HomeDurationLabel));
    public static string CurrentStageLabel => Get(nameof(CurrentStageLabel));
    public static string NextActionLabel => Get(nameof(NextActionLabel));
    public static string SettingsTitle => Get(nameof(SettingsTitle));
    public static string SettingsSubtitle => Get(nameof(SettingsSubtitle));
    public static string RehearsalDurationLabel => Get(nameof(RehearsalDurationLabel));
    public static string MaxMinutesLabel => Get(nameof(MaxMinutesLabel));
    public static string StepLimitsTitle => Get(nameof(StepLimitsTitle));
    public static string StepLimitsSubtitle => Get(nameof(StepLimitsSubtitle));
    public static string StepLimitInputLabel => Get(nameof(StepLimitInputLabel));
    public static string TimestampTitle => Get(nameof(TimestampTitle));
    public static string CheckpointStartRehearsal => Get(nameof(CheckpointStartRehearsal));
    public static string CheckpointEnterFloor => Get(nameof(CheckpointEnterFloor));
    public static string CheckpointMusicStart => Get(nameof(CheckpointMusicStart));
    public static string CheckpointMainSectionStart => Get(nameof(CheckpointMainSectionStart));
    public static string CheckpointMainSectionEnd => Get(nameof(CheckpointMainSectionEnd));
    public static string CheckpointMusicEnd => Get(nameof(CheckpointMusicEnd));
    public static string CheckpointLeaveFloor => Get(nameof(CheckpointLeaveFloor));
    public static string CheckpointEndRehearsal => Get(nameof(CheckpointEndRehearsal));
    public static string SegmentMarchOn => Get(nameof(SegmentMarchOn));
    public static string SegmentEntry => Get(nameof(SegmentEntry));
    public static string SegmentMainSection => Get(nameof(SegmentMainSection));
    public static string SegmentExit => Get(nameof(SegmentExit));
    public static string SegmentWalkOff => Get(nameof(SegmentWalkOff));
    public static string DurationValidationMessage => Get(nameof(DurationValidationMessage));
    public static string RehearsalDurationValueFormat => Get(nameof(RehearsalDurationValueFormat));
    public static string StartTimerButton => Get(nameof(StartTimerButton));
    public static string ResetTimerButton => Get(nameof(ResetTimerButton));
    public static string MarkCheckpointButtonFormat => Get(nameof(MarkCheckpointButtonFormat));
    public static string HomeStageReady => Get(nameof(HomeStageReady));
    public static string HomeStageWaitingFormat => Get(nameof(HomeStageWaitingFormat));
    public static string HomeStageActiveFormat => Get(nameof(HomeStageActiveFormat));
    public static string HomeStageComplete => Get(nameof(HomeStageComplete));
    public static string HomeNextActionFirstFormat => Get(nameof(HomeNextActionFirstFormat));
    public static string HomeNextActionFormat => Get(nameof(HomeNextActionFormat));
    public static string HomeNextActionReset => Get(nameof(HomeNextActionReset));
    public static string TimestampPendingValue => Get(nameof(TimestampPendingValue));
    public static string TimestampNotCapturedDetail => Get(nameof(TimestampNotCapturedDetail));
    public static string TimestampRunningDetailFormat => Get(nameof(TimestampRunningDetailFormat));
    public static string TimestampCapturedDetailFormat => Get(nameof(TimestampCapturedDetailFormat));
    public static string StepLimitValidationMessage => Get(nameof(StepLimitValidationMessage));

    public static string Get(string key)
    {
        return ResourceManager.GetString(key, CultureInfo.CurrentUICulture) ?? key;
    }
}
