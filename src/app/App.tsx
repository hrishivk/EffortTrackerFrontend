import Routers from "../routes/Route";
import { SnackbarProvider } from "../contexts/SnackbarContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { Provider } from "react-redux";
import store, { persistor } from "../store/configureStore";
import { PersistGate } from "redux-persist/integration/react";
import { Suspense } from "react";
import { HashRouter } from "react-router-dom";
import RxSpinner from "../presentation/RxSpinner";
function App() {
  return (
    <>
    <ThemeProvider>
    <HashRouter>
    <Suspense fallback={<RxSpinner size={110} color="#fff" />}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SnackbarProvider>
            <Routers />
          </SnackbarProvider>
        </PersistGate>
      </Provider>
      </Suspense>
      </HashRouter>
    </ThemeProvider>
    </>
  );
}

export default App;
