using System.Windows.Input;
using Microsoft.Maui.Controls;

namespace FormationsTimer.UI.Behaviors;

public partial class SpaceKeyBehavior : Behavior<ContentPage>
{
    public static readonly BindableProperty CommandProperty =
        BindableProperty.Create(
            nameof(Command),
            typeof(ICommand),
            typeof(SpaceKeyBehavior));

    public static readonly BindableProperty CommandParameterProperty =
        BindableProperty.Create(
            nameof(CommandParameter),
            typeof(object),
            typeof(SpaceKeyBehavior));

    private ContentPage? _attachedPage;
    private Microsoft.Maui.Controls.Window? _window;

    public ICommand? Command
    {
        get => (ICommand?)GetValue(CommandProperty);
        set => SetValue(CommandProperty, value);
    }

    public object? CommandParameter
    {
        get => GetValue(CommandParameterProperty);
        set => SetValue(CommandParameterProperty, value);
    }

    protected override void OnAttachedTo(ContentPage bindable)
    {
        base.OnAttachedTo(bindable);

        _attachedPage = bindable;
        BindingContext = bindable.BindingContext;

        bindable.BindingContextChanged += OnBindingContextChanged;
        bindable.HandlerChanged += OnHandlerChanged;
        bindable.Loaded += OnLoaded;
        bindable.Unloaded += OnUnloaded;
        bindable.Appearing += OnAppearing;
        bindable.Disappearing += OnDisappearing;

        AttachWindowEvents();
        ReconnectPlatform();
        ActivatePlatform();
    }

    protected override void OnDetachingFrom(ContentPage bindable)
    {
        DetachWindowEvents();
        DisconnectPlatform();

        bindable.BindingContextChanged -= OnBindingContextChanged;
        bindable.HandlerChanged -= OnHandlerChanged;
        bindable.Loaded -= OnLoaded;
        bindable.Unloaded -= OnUnloaded;
        bindable.Appearing -= OnAppearing;
        bindable.Disappearing -= OnDisappearing;

        BindingContext = null;
        _attachedPage = null;

        base.OnDetachingFrom(bindable);
    }

    private void OnBindingContextChanged(object? sender, EventArgs e)
    {
        BindingContext = _attachedPage?.BindingContext;
    }

    private void OnHandlerChanged(object? sender, EventArgs e)
    {
        AttachWindowEvents();
        ReconnectPlatform();
        ActivatePlatform();
    }

    private void OnLoaded(object? sender, EventArgs e)
    {
        AttachWindowEvents();
        ReconnectPlatform();
        ActivatePlatform();
    }

    private void OnUnloaded(object? sender, EventArgs e)
    {
        DetachWindowEvents();
        DisconnectPlatform();
    }

    private void OnAppearing(object? sender, EventArgs e)
    {
        AttachWindowEvents();
        ReconnectPlatform();
        ActivatePlatform();
    }

    private void OnDisappearing(object? sender, EventArgs e)
    {
        DetachWindowEvents();
        DisconnectPlatform();
    }

    private void AttachWindowEvents()
    {
        if (_attachedPage?.Window is null || ReferenceEquals(_window, _attachedPage.Window))
        {
            return;
        }

        DetachWindowEvents();
        _window = _attachedPage.Window;
        _window.Activated += OnWindowActivated;
    }

    private void DetachWindowEvents()
    {
        if (_window is null)
        {
            return;
        }

        _window.Activated -= OnWindowActivated;
        _window = null;
    }

    private void OnWindowActivated(object? sender, EventArgs e)
    {
        ReconnectPlatform();
        ActivatePlatform();
    }

    internal void ExecuteCommand()
    {
        var command = Command;
        var parameter = CommandParameter;

        if (command?.CanExecute(parameter) != true)
        {
            return;
        }

        command.Execute(parameter);
    }

    private void ReconnectPlatform()
    {
        DisconnectPlatform();

        if (_attachedPage is null)
        {
            return;
        }

        ConnectPlatformCore(_attachedPage);
    }

    private void DisconnectPlatform()
    {
        DisconnectPlatformCore();
    }

    private void ActivatePlatform()
    {
        ActivatePlatformCore();
    }

    partial void ConnectPlatformCore(ContentPage page);
    partial void DisconnectPlatformCore();
    partial void ActivatePlatformCore();
}
