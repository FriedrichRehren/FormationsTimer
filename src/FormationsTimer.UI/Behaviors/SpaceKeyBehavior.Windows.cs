using Microsoft.Maui.Controls;

#if WINDOWS
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Input;
using Windows.System;

namespace FormationsTimer.UI.Behaviors;

public partial class SpaceKeyBehavior
{
    private FrameworkElement? _platformView;

    partial void ConnectPlatformCore(ContentPage page)
    {
        if (page.Handler?.PlatformView is not FrameworkElement platformView)
        {
            return;
        }

        _platformView = platformView;
        _platformView.KeyDown += OnKeyDown;
    }

    partial void DisconnectPlatformCore()
    {
        if (_platformView is null)
        {
            return;
        }

        _platformView.KeyDown -= OnKeyDown;
        _platformView = null;
    }

    partial void ActivatePlatformCore()
    {
        _platformView?.Focus(FocusState.Programmatic);
    }

    private void OnKeyDown(object sender, KeyRoutedEventArgs e)
    {
        if (e.Key != VirtualKey.Space || e.KeyStatus.WasKeyDown)
        {
            return;
        }

        ExecuteCommand();
        e.Handled = true;
    }
}
#endif
