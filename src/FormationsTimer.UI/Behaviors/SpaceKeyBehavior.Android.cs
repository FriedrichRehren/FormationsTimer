using Microsoft.Maui.Controls;

#if ANDROID
using Android.Views;
using AView = Android.Views.View;

namespace FormationsTimer.UI.Behaviors;

public partial class SpaceKeyBehavior
{
    private AView? _platformView;

    partial void ConnectPlatformCore(ContentPage page)
    {
        if (page.Handler?.PlatformView is not AView nativeView)
        {
            return;
        }

        _platformView = nativeView;
        _platformView.KeyPress += OnKeyPress;
    }

    partial void DisconnectPlatformCore()
    {
        if (_platformView is null)
        {
            return;
        }

        _platformView.KeyPress -= OnKeyPress;
        _platformView = null;
    }

    partial void ActivatePlatformCore()
    {
        if (_platformView is null)
        {
            return;
        }

        _platformView.Focusable = true;
        _platformView.FocusableInTouchMode = true;
        _platformView.RequestFocus();
    }

    private void OnKeyPress(object? sender, AView.KeyEventArgs e)
    {
        if (e.Event is null)
        {
            return;
        }

        if (e.Event.Action == KeyEventActions.Down
            && e.KeyCode == Keycode.Space
            && e.Event.RepeatCount == 0)
        {
            ExecuteCommand();
            e.Handled = true;
        }
    }
}
#endif
