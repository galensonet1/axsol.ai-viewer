import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './index.css';
import AppWrapper from './AppWrapper.jsx';
import { UserProvider } from './context/UserContext.jsx';

const root = createRoot(document.getElementById('root'));

// Configuración de Auth0 desde variables de entorno
const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN || 'dev-5w3rsxchwj0qq2qd.us.auth0.com';
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID || 'lKYxZesYzWqgrFwanAi2rQEkS9kUYn6z';
const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE || 'https://api.axsol-viewer.com';

root.render(
  <StrictMode>
    <BrowserRouter>
      <Auth0Provider
        domain={AUTH0_DOMAIN}
        clientId={AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: AUTH0_AUDIENCE,
          scope: 'openid profile email',
        }}
      >
        <UserProvider>
          <AppWrapper />
        </UserProvider>
      </Auth0Provider>
    </BrowserRouter>
  </StrictMode>
);
