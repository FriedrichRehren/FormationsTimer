using FormationsTimer.UI.ViewModels;

namespace FormationsTimer.UI.Views;

public partial class SettingsPage : ContentPage
{
    public SettingsPage(FormationTimerViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
