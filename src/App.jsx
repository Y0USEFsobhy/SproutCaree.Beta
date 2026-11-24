import { RouterProvider } from "react-router"
import { router } from "./router"
import AuthListener from "./components/onAuthStateChanged"
function App() {
  return (
    <>
    <AuthListener />
    <RouterProvider router={router} />
    </>
  )
}

export default App
