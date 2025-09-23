import Routers from "./routes/Route";
import { SnackbarProvider } from "../src/contexts/SnackbarContext";
import { Provider } from "react-redux";
import store, { persistor } from "./store/configureStore";
import { PersistGate } from "redux-persist/integration/react";
import { Suspense } from "react";
import { HashRouter } from "react-router-dom";
import RxLoader from "./presentation/Loader";
function App() {
  return (
    <>
    <HashRouter>
    <Suspense fallback={<RxLoader/>}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SnackbarProvider>
            <Routers />
          </SnackbarProvider>
        </PersistGate>
      </Provider>
      </Suspense>
      </HashRouter>
    </>
  );
}

export default App;
