using FormationsTimer.UI.ViewModels;

namespace FormationsTimer.UI.Views;

public partial class MainPage : ContentPage
{
    private const double WideLayoutBreakpoint = 640;
    private bool _isWideLayout;

    public MainPage(FormationTimerViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }

    private void FocusPrimaryActionButton()
    {
        Dispatcher.DispatchDelayed(
            TimeSpan.FromMilliseconds(75),
            () =>
            {
                var button = _isWideLayout ? LandscapePrimaryActionButton : PortraitPrimaryActionButton;
                button?.Focus();
            });
    }

    protected override void OnSizeAllocated(double width, double height)
    {
        base.OnSizeAllocated(width, height);

        if (width <= 0 || PortraitLayout is null || LandscapeLayout is null)
        {
            return;
        }

        ApplyResponsiveLayout(width >= WideLayoutBreakpoint);
    }

    private void ApplyResponsiveLayout(bool isWideLayout)
    {
        if (_isWideLayout == isWideLayout
            && PortraitLayout.IsVisible == !isWideLayout
            && LandscapeLayout.IsVisible == isWideLayout)
        {
            return;
        }

        _isWideLayout = isWideLayout;
        PortraitLayout.IsVisible = !isWideLayout;
        LandscapeLayout.IsVisible = isWideLayout;
        FocusPrimaryActionButton();
    }
}