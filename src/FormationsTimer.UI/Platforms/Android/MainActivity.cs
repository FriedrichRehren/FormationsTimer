using Android.App;
using Android.Content.PM;
using Android.OS;

namespace FormationsTimer.UI
{
    [Activity(Theme = "@style/Maui.SplashTheme", MainLauncher = true, LaunchMode = LaunchMode.SingleTop, ConfigurationChanges = ConfigChanges.ScreenSize | ConfigChanges.Orientation | ConfigChanges.UiMode | ConfigChanges.ScreenLayout | ConfigChanges.SmallestScreenSize | ConfigChanges.Density)]
    public class MainActivity : MauiAppCompatActivity
    {
        protected override void OnCreate(Bundle? savedInstanceState)
        {
            RequestedOrientation = IsTablet()
                ? ScreenOrientation.SensorLandscape
                : ScreenOrientation.Portrait;

            base.OnCreate(savedInstanceState);
        }

        private bool IsTablet()
        {
            return (Resources?.Configuration?.SmallestScreenWidthDp ?? 0) >= 600;
        }
    }
}
