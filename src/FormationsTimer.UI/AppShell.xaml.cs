using FormationsTimer.UI.Views;
using Microsoft.Extensions.DependencyInjection;

namespace FormationsTimer.UI;

public partial class AppShell : Shell
{
    public AppShell(IServiceProvider services)
    {
        InitializeComponent();
        HomeShellContent.ContentTemplate =
            new DataTemplate(() => services.GetRequiredService<MainPage>());
        SettingsShellContent.ContentTemplate =
            new DataTemplate(() => services.GetRequiredService<SettingsPage>());
    }
}
