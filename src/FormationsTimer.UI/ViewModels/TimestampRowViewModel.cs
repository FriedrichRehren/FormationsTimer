using CommunityToolkit.Mvvm.ComponentModel;
using FormationsTimer.UI.Localization;

namespace FormationsTimer.UI.ViewModels;

public partial class TimestampRowViewModel : ObservableObject
{
    public TimestampRowViewModel(string title)
    {
        Title = title;
    }

    public string Title { get; }

    [ObservableProperty]
    public partial string ElapsedText { get; set; } = AppStrings.TimestampPendingValue;

    [ObservableProperty]
    public partial string ClockText { get; set; } = AppStrings.TimestampNotCapturedDetail;

    [ObservableProperty]
    public partial string MaxDurationInput { get; set; } = string.Empty;

    [ObservableProperty]
    public partial bool HasMaxDurationValidationMessage { get; set; }

    [ObservableProperty]
    public partial string MaxDurationValidationMessage { get; set; } = string.Empty;

    [ObservableProperty]
    public partial bool IsOverLimit { get; set; }
}
