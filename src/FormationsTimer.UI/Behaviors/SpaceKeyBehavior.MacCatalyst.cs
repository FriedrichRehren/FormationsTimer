using Microsoft.Maui.Controls;

#if MACCATALYST
using CoreGraphics;
using Foundation;
using ObjCRuntime;
using UIKit;

namespace FormationsTimer.UI.Behaviors;

public partial class SpaceKeyBehavior
{
    private UIViewController? _platformViewController;
    private SpaceKeyCommandController? _keyCommandController;

    partial void ConnectPlatformCore(ContentPage page)
    {
        if (page.Handler?.PlatformView is not UIViewController viewController)
        {
            return;
        }

        _platformViewController = viewController;
        _keyCommandController = new SpaceKeyCommandController(ExecuteCommand);
        _keyCommandController.LoadViewIfNeeded();

        if (_platformViewController.View is null || _keyCommandController.View is null)
        {
            return;
        }

        _platformViewController.AddChildViewController(_keyCommandController);
        _platformViewController.View.AddSubview(_keyCommandController.View);
        _keyCommandController.DidMoveToParentViewController(_platformViewController);
    }

    partial void DisconnectPlatformCore()
    {
        if (_keyCommandController is null || _platformViewController is null)
        {
            return;
        }

        _keyCommandController.WillMoveToParentViewController(null);
        _keyCommandController.View?.RemoveFromSuperview();
        _keyCommandController.RemoveFromParentViewController();
        _keyCommandController.Dispose();

        _keyCommandController = null;
        _platformViewController = null;
    }

    partial void ActivatePlatformCore()
    {
        _keyCommandController?.Activate();
    }

    private sealed class SpaceKeyCommandController : UIViewController
    {
        private static readonly Selector HandleSpaceKeySelector = new("handleSpaceKeyCommand:");
        private readonly Action _executeCommand;
        private UIKeyCommand? _spaceKeyCommand;

        public SpaceKeyCommandController(Action executeCommand)
        {
            _executeCommand = executeCommand;
        }

        public override bool CanBecomeFirstResponder => true;

        public override UIKeyCommand[] KeyCommands =>
        [
            _spaceKeyCommand ??= UIKeyCommand.Create(new NSString(" "), (UIKeyModifierFlags)0, HandleSpaceKeySelector)
        ];

        public void Activate()
        {
            BecomeFirstResponder();
        }

        public override void LoadView()
        {
            View = new UIView(CGRect.Empty)
            {
                Hidden = true,
                UserInteractionEnabled = false
            };
        }

        [Export("handleSpaceKeyCommand:")]
        private void HandleSpaceKeyCommand(UIKeyCommand command)
        {
            _executeCommand();
        }
    }
}
#endif
