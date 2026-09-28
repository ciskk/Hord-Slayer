package com.hordslayer.game;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.os.Build;
import android.view.Display;
import android.webkit.WebView;
import androidx.core.content.FileProvider;
import androidx.webkit.WebViewCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONArray;

/** Diagnostic operations are unavailable in normal release builds. */
@CapacitorPlugin(name = "PerformanceLab")
public class PerformanceLabPlugin extends Plugin {
    private MainActivity activity() { return (MainActivity) getActivity(); }

    @PluginMethod public void getInfo(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            JSObject result = new JSObject();
            result.put("diagnostics", BuildConfig.PERF_DIAGNOSTICS);
            if (!BuildConfig.PERF_DIAGNOSTICS) { call.resolve(result); return; }
            try {
                WebView view = getBridge().getWebView();
                Display display = getActivity().getWindowManager().getDefaultDisplay();
                PackageInfo provider = WebViewCompat.getCurrentWebViewPackage(getContext());
                result.put("profile", activity().getPerformanceProfile());
                result.put("buildType", BuildConfig.BUILD_TYPE);
                result.put("manufacturer", Build.MANUFACTURER);
                result.put("model", Build.MODEL);
                result.put("android", Build.VERSION.RELEASE);
                result.put("api", Build.VERSION.SDK_INT);
                result.put("webViewPackage", provider == null ? "unknown" : provider.packageName);
                result.put("webViewVersion", provider == null ? "unknown" : provider.versionName);
                result.put("viewHardwareAccelerated", view.isHardwareAccelerated());
                result.put("viewLayerType", view.getLayerType());
                result.put("requestedModeId", getActivity().getWindow().getAttributes().preferredDisplayModeId);
                if (display != null) {
                    result.put("displayHz", display.getRefreshRate());
                    result.put("activeModeId", display.getMode().getModeId());
                    JSONArray modes = new JSONArray();
                    for (Display.Mode mode : display.getSupportedModes()) {
                        JSObject m = new JSObject();
                        m.put("id", mode.getModeId()); m.put("hz", mode.getRefreshRate());
                        m.put("width", mode.getPhysicalWidth()); m.put("height", mode.getPhysicalHeight()); modes.put(m);
                    }
                    result.put("supportedModes", modes);
                }
                call.resolve(result);
            } catch (Exception error) { call.reject("Não foi possível ler o ambiente Android", error); }
        });
    }

    @PluginMethod public void setProfile(PluginCall call) {
        if (!BuildConfig.PERF_DIAGNOSTICS) { call.reject("Diagnostic build required"); return; }
        String profile = call.getString("profile", "standard");
        if (!java.util.Arrays.asList("legacy", "layer-default", "standard", "60", "120").contains(profile)) {
            call.reject("Invalid profile"); return;
        }
        getActivity().runOnUiThread(() -> {
            try {
                activity().getPreferences(android.content.Context.MODE_PRIVATE).edit().putString("performanceProfile", profile).apply();
                activity().applyPerformanceProfile(profile); call.resolve();
            } catch (Exception error) { call.reject("Falha ao aplicar perfil", error); }
        });
    }

    @PluginMethod public void shareReport(PluginCall call) {
        if (!BuildConfig.PERF_DIAGNOSTICS) { call.reject("Diagnostic build required"); return; }
        String json = call.getString("json", "{}");
        if (json.length() > 2000000) { call.reject("Report too large"); return; }
        try {
            File file = new File(getContext().getCacheDir(), "hord-performance.json");
            try (FileOutputStream output = new FileOutputStream(file)) { output.write(json.getBytes(StandardCharsets.UTF_8)); }
            android.net.Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
            Intent send = new Intent(Intent.ACTION_SEND).setType("application/json")
                .putExtra(Intent.EXTRA_STREAM, uri).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().runOnUiThread(() -> {
                try { getActivity().startActivity(Intent.createChooser(send, "Salvar ou compartilhar diagnóstico")); call.resolve(); }
                catch (Exception error) { call.reject("Falha ao abrir compartilhamento", error); }
            });
        } catch (Exception error) { call.reject("Falha ao preparar relatório", error); }
    }
}
