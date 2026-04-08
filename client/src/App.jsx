import AppRoutes from "./routes/AppRoutes";
import LoaderWrapper from "./pages/LoaderPage";
import { SettingsProvider } from "./context/SettingsContext";
import { ThemeProvider } from "./context/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <LoaderWrapper>
          <AppRoutes />
        </LoaderWrapper>
      </SettingsProvider>
    </ThemeProvider>
  );
}
