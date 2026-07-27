using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Globalization;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using FormationsTimer.UI.Domain;
using FormationsTimer.UI.Localization;
using Microsoft.Maui.Dispatching;

namespace FormationsTimer.UI.ViewModels;

public partial class FormationTimerViewModel : ObservableObject
{
    private static readonly string[] StepLimitFormats =
    [
        @"m\:ss",
        @"mm\:ss",
        @"h\:mm\:ss",
        @"m\:ss\.f",
        @"mm\:ss\.f",
        @"h\:mm\:ss\.f"
    ];

    private readonly IDispatcherTimer _timer;
    private readonly List<CapturedCheckpoint> _capturedCheckpoints = [];
    private readonly Dictionary<CheckpointType, TimestampRowViewModel> _timestampRowsByType;

    private TimeSpan _configuredDuration = TimeSpan.FromMinutes(15);
    private DateTimeOffset? _startedAt;

    [ObservableProperty]
    public partial string MaxMinutes { get; set; } = "15";

    [ObservableProperty]
    public partial string ConfiguredDurationText { get; set; } = "15 min";

    [ObservableProperty]
    public partial string RemainingTimeText { get; set; } = "00:00.0";

    [ObservableProperty]
    public partial bool IsOvertime { get; set; }

    [ObservableProperty]
    public partial string CurrentStageText { get; set; } = string.Empty;

    [ObservableProperty]
    public partial string NextActionText { get; set; } = string.Empty;

    [ObservableProperty]
    public partial string PrimaryActionText { get; set; } = string.Empty;

    [ObservableProperty]
    public partial string DurationValidationMessage { get; set; } = string.Empty;

    [ObservableProperty]
    public partial bool HasDurationValidationMessage { get; set; }

    public FormationTimerViewModel()
    {
        var dispatcher = Application.Current?.Dispatcher
            ?? throw new InvalidOperationException("A dispatcher is required for the timer.");

        _timer = dispatcher.CreateTimer();
        _timer.Interval = TimeSpan.FromMilliseconds(100);
        _timer.Tick += OnTimerTick;

        TimestampRows = new ObservableCollection<TimestampRowViewModel>(
            FormationTimerTimeline.Checkpoints.Select(
                checkpoint => new TimestampRowViewModel(FormationTimerText.GetCheckpointName(checkpoint.Type))));

        foreach (var row in TimestampRows)
        {
            row.PropertyChanged += OnTimestampRowPropertyChanged;
        }

        _timestampRowsByType = TimestampRows
            .Zip(FormationTimerTimeline.Checkpoints, (row, checkpoint) => new { row, checkpoint })
            .ToDictionary(item => item.checkpoint.Type, item => item.row);

        ConfigurableTimestampRows = new ObservableCollection<TimestampRowViewModel>(
            FormationTimerTimeline.Checkpoints
                .Where(checkpoint => checkpoint.IsStepLimitConfigurable)
                .Select(checkpoint => _timestampRowsByType[checkpoint.Type]));

        ApplyDurationFromInputs();
        RefreshState(DateTimeOffset.Now);
    }

    public ObservableCollection<TimestampRowViewModel> TimestampRows { get; }

    public ObservableCollection<TimestampRowViewModel> ConfigurableTimestampRows { get; }

    partial void OnMaxMinutesChanged(string value)
    {
        ApplyDurationFromInputs();
        RefreshState(DateTimeOffset.Now);
    }

    [RelayCommand]
    private void TriggerPrimaryAction()
    {
        var now = DateTimeOffset.Now;

        if (_capturedCheckpoints.Count == FormationTimerTimeline.Count)
        {
            ResetRun();
            return;
        }

        if (_startedAt is null)
        {
            StartNewRun(now);
            return;
        }

        var nextCheckpoint = FormationTimerTimeline.GetNextCheckpoint(_capturedCheckpoints.Count);
        _capturedCheckpoints.Add(new CapturedCheckpoint(nextCheckpoint.Type, now));
        RefreshState(now);
    }

    private void StartNewRun(DateTimeOffset now)
    {
        _capturedCheckpoints.Clear();
        _startedAt = now;
        _capturedCheckpoints.Add(new CapturedCheckpoint(FormationTimerTimeline.FirstCheckpoint.Type, now));
        RefreshState(now);
    }

    private void ResetRun()
    {
        _capturedCheckpoints.Clear();
        _startedAt = null;
        RefreshState(DateTimeOffset.Now);
    }

    private void OnTimerTick(object? sender, EventArgs e)
    {
        RefreshState(DateTimeOffset.Now);
    }

    private void RefreshState(DateTimeOffset now)
    {
        ConfiguredDurationText = FormatConfiguredDuration(_configuredDuration);
        RefreshCountdown(now);
        RefreshStatus();
        RefreshTimestampRows(now);
        UpdateTimerState();
    }

    private void RefreshCountdown(DateTimeOffset now)
    {
        if (_startedAt is null)
        {
            RemainingTimeText = FormatTenthsDuration(_configuredDuration);
            IsOvertime = false;
            return;
        }

        var referenceTime = _capturedCheckpoints.Count == FormationTimerTimeline.Count
            ? _capturedCheckpoints[^1].Timestamp
            : now;

        var remaining = _configuredDuration - (referenceTime - _startedAt.Value);
        IsOvertime = remaining < TimeSpan.Zero;
        RemainingTimeText = remaining < TimeSpan.Zero
            ? $"-{FormatTenthsDuration(remaining.Duration())}"
            : FormatTenthsDuration(remaining);
    }

    private void RefreshStatus()
    {
        if (_startedAt is null)
        {
            CurrentStageText = AppStrings.HomeStageReady;
            NextActionText = string.Format(
                CultureInfo.CurrentUICulture,
                AppStrings.HomeNextActionFirstFormat,
                FormationTimerText.GetCheckpointName(FormationTimerTimeline.FirstCheckpoint.Type));
            PrimaryActionText = AppStrings.StartTimerButton;
            return;
        }

        if (_capturedCheckpoints.Count == FormationTimerTimeline.Count)
        {
            CurrentStageText = AppStrings.HomeStageComplete;
            NextActionText = AppStrings.HomeNextActionReset;
            PrimaryActionText = AppStrings.ResetTimerButton;
            return;
        }

        var nextCheckpoint = FormationTimerTimeline.GetNextCheckpoint(_capturedCheckpoints.Count);
        CurrentStageText = nextCheckpoint.ActiveSegmentBefore is SegmentType activeSegment
            ? string.Format(
                CultureInfo.CurrentUICulture,
                AppStrings.HomeStageActiveFormat,
                FormationTimerText.GetSegmentName(activeSegment))
            : string.Format(
                CultureInfo.CurrentUICulture,
                AppStrings.HomeStageWaitingFormat,
                FormationTimerText.GetCheckpointName(nextCheckpoint.Type));

        NextActionText = string.Format(
            CultureInfo.CurrentUICulture,
            AppStrings.HomeNextActionFormat,
            FormationTimerText.GetCheckpointName(nextCheckpoint.Type));

        PrimaryActionText = string.Format(
            CultureInfo.CurrentUICulture,
            AppStrings.MarkCheckpointButtonFormat,
            FormationTimerText.GetCheckpointName(nextCheckpoint.Type));
    }

    private void RefreshTimestampRows(DateTimeOffset now)
    {
        foreach (var checkpoint in FormationTimerTimeline.Checkpoints)
        {
            var checkpointType = checkpoint.Type;
            var row = _timestampRowsByType[checkpointType];
            var captured = GetCapturedCheckpoint(checkpointType);

            if (_startedAt is null)
            {
                row.ElapsedText = AppStrings.TimestampPendingValue;
                row.ClockText = AppStrings.TimestampNotCapturedDetail;
                ApplyStepLimitState(row, null);
                continue;
            }

            if (captured is not null)
            {
                var elapsed = captured.Value.Timestamp - GetStepStartedAt(checkpointType);
                row.ElapsedText = FormatTenthsDuration(elapsed);
                row.ClockText = string.Format(
                    CultureInfo.CurrentUICulture,
                    AppStrings.TimestampCapturedDetailFormat,
                    captured.Value.Timestamp.LocalDateTime.ToString("T", CultureInfo.CurrentUICulture));
                ApplyStepLimitState(row, elapsed);
                continue;
            }

            if (IsCurrentCheckpoint(checkpointType))
            {
                var stepStartedAt = GetStepStartedAt(checkpointType);
                var elapsed = now - stepStartedAt;
                row.ElapsedText = FormatTenthsDuration(elapsed);
                row.ClockText = string.Format(
                    CultureInfo.CurrentUICulture,
                    AppStrings.TimestampRunningDetailFormat,
                    stepStartedAt.LocalDateTime.ToString("T", CultureInfo.CurrentUICulture));
                ApplyStepLimitState(row, elapsed);
                continue;
            }

            row.ElapsedText = AppStrings.TimestampPendingValue;
            row.ClockText = AppStrings.TimestampNotCapturedDetail;
            ApplyStepLimitState(row, null);
        }
    }

    private void UpdateTimerState()
    {
        var shouldRun = _startedAt is not null && _capturedCheckpoints.Count < FormationTimerTimeline.Count;

        if (shouldRun && !_timer.IsRunning)
        {
            _timer.Start();
        }
        else if (!shouldRun && _timer.IsRunning)
        {
            _timer.Stop();
        }
    }

    private void ApplyDurationFromInputs()
    {
        if (!TryParseDuration(MaxMinutes, out var duration))
        {
            HasDurationValidationMessage = true;
            DurationValidationMessage = AppStrings.DurationValidationMessage;
            return;
        }

        _configuredDuration = duration;
        HasDurationValidationMessage = false;
        DurationValidationMessage = string.Empty;
    }

    private void OnTimestampRowPropertyChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName != nameof(TimestampRowViewModel.MaxDurationInput))
        {
            return;
        }

        RefreshState(DateTimeOffset.Now);
    }

    private bool IsCurrentCheckpoint(CheckpointType checkpointType)
    {
        return _startedAt is not null
            && _capturedCheckpoints.Count < FormationTimerTimeline.Count
            && FormationTimerTimeline.GetNextCheckpoint(_capturedCheckpoints.Count).Type == checkpointType;
    }

    private static void ApplyStepLimitState(TimestampRowViewModel row, TimeSpan? elapsed)
    {
        if (!TryParseStepLimit(row.MaxDurationInput, out var maxDuration))
        {
            row.HasMaxDurationValidationMessage = true;
            row.MaxDurationValidationMessage = AppStrings.StepLimitValidationMessage;
            row.IsOverLimit = false;
            return;
        }

        row.HasMaxDurationValidationMessage = false;
        row.MaxDurationValidationMessage = string.Empty;
        row.IsOverLimit = maxDuration is not null
            && elapsed is not null
            && elapsed.Value > maxDuration.Value;
    }

    private CapturedCheckpoint? GetCapturedCheckpoint(CheckpointType checkpointType)
    {
        foreach (var captured in _capturedCheckpoints)
        {
            if (captured.Checkpoint == checkpointType)
            {
                return captured;
            }
        }

        return null;
    }

    private DateTimeOffset GetStepStartedAt(CheckpointType checkpointType)
    {
        if (_startedAt is null)
        {
            return DateTimeOffset.MinValue;
        }

        var checkpointIndex = FormationTimerTimeline.GetIndex(checkpointType);
        if (checkpointIndex <= 0)
        {
            return _startedAt.Value;
        }

        var previousCheckpoint = GetCapturedCheckpoint(
            FormationTimerTimeline.GetCheckpointAt(checkpointIndex - 1).Type);
        return previousCheckpoint?.Timestamp ?? _startedAt.Value;
    }

    private static bool TryParseDuration(string minutesText, out TimeSpan duration)
    {
        duration = TimeSpan.Zero;

        if (!int.TryParse(minutesText, NumberStyles.None, CultureInfo.InvariantCulture, out var minutes))
        {
            return false;
        }

        if (minutes <= 0)
        {
            return false;
        }

        duration = TimeSpan.FromMinutes(minutes);
        return true;
    }

    private static bool TryParseStepLimit(string? value, out TimeSpan? duration)
    {
        duration = null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        if (!TimeSpan.TryParseExact(
                value.Trim(),
                StepLimitFormats,
                CultureInfo.InvariantCulture,
                out var parsedDuration))
        {
            return false;
        }

        if (parsedDuration < TimeSpan.Zero)
        {
            return false;
        }

        duration = parsedDuration;
        return true;
    }

    private static string FormatTenthsDuration(TimeSpan duration)
    {
        duration = duration.Duration();

        return duration.TotalHours >= 1
            ? duration.ToString(@"h\:mm\:ss\.f", CultureInfo.InvariantCulture)
            : duration.ToString(@"mm\:ss\.f", CultureInfo.InvariantCulture);
    }

    private static string FormatConfiguredDuration(TimeSpan duration)
    {
        return string.Format(
            CultureInfo.CurrentUICulture,
            AppStrings.RehearsalDurationValueFormat,
            (int)duration.TotalMinutes);
    }

    private readonly record struct CapturedCheckpoint(
        CheckpointType Checkpoint,
        DateTimeOffset Timestamp);
}
