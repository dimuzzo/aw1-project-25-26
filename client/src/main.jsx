import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router";
import App from './App.jsx'

// unica route che cattura ogni path e lascia lo smistamento a <App> (che contiene <Routes>)
const router = createBrowserRouter([{ path: "/*", element: <App /> }]);
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)