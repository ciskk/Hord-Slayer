package com.hordslayer.game;

import android.os.Bundle;
import android.view.Display;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle state) {
        registerPlugin(PerformanceLabPlugin.class);
        super.onCreate(state);
        applyPerformanceProfile(getPerformanceProfile());
    }

    @Override public void onResume() {
        super.onResume();
        applyPerformanceProfile(getPerformanceProfile());
    }

    String getPerformanceProfile() {
        return BuildConfig.PERF_DIAGNOSTICS
            ? getPreferences(MODE_PRIVATE).getString("performanceProfile", "standard") : "standard";
    }

    void applyPerformanceProfile(String profile) {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        // NONE means no extra cached View layer, not software rendering.
        // Hardware acceleration stays enabled in AndroidManifest.xml.
        getBridge().getWebView().setLayerType(
            profile.equals("legacy") ? View.LAYER_TYPE_HARDWARE : View.LAYER_TYPE_NONE, null);
        Display display = getWindowManager().getDefaultDisplay();
        WindowManager.LayoutParams params = getWindow().getAttributes();
        params.preferredDisplayModeId = 0;
        params.preferredRefreshRate = 0;
        if (display != null && !profile.equals("standard")) {
            Display.Mode current = display.getMode();
            Display.Mode selected = null;
            boolean unrestricted = profile.equals("legacy") || profile.equals("layer-default");
            float target = profile.equals("60") ? 60f : 120f;
            float best = Float.MAX_VALUE;
            float maxRate = 60f;
            for (Display.Mode mode : display.getSupportedModes()) {
                if (unrestricted) {
                    // Exact selection policy from the former wrapper, for A/B only.
                    if (mode.getRefreshRate() > maxRate) { maxRate = mode.getRefreshRate(); selected = mode; }
                } else if (mode.getPhysicalWidth() == current.getPhysicalWidth()
                        && mode.getPhysicalHeight() == current.getPhysicalHeight()) {
                    float distance = Math.abs(mode.getRefreshRate() - target);
                    if (distance < best) { best = distance; selected = mode; }
                }
            }
            if (selected != null) params.preferredDisplayModeId = selected.getModeId();
        }
        getWindow().setAttributes(params);
    }
}
