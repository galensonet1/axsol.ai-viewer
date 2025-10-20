import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { Ion } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './index.css';
import AppWrapper from './AppWrapper.jsx';
import { UserProvider } from './context/UserContext.jsx';
import api from './config/api';

const root = createRoot(document.getElementById('root'));

async function bootstrap() {
  try {
    const apiOrigin = (import.meta.env.VITE_API_BASE_URL || window.location.origin);
    const res = await fetch(`${apiOrigin.replace(/\/$/, '')}/api/config`, { credentials: 'include' });
    const cfg = await res.json().catch(() => ({}));
    window.__CONFIG__ = cfg || {};

    // Configure Cesium Ion token if provided
    const ionToken = window.__CONFIG__?.cesium?.ionToken;
    if (ionToken) {
      Ion.defaultAccessToken = ionToken;
    }

    // Configure API base URL for axios instance
    if (window.__CONFIG__?.apiBaseUrl) {
      api.defaults.baseURL = window.__CONFIG__.apiBaseUrl;
    } else if (import.meta.env.VITE_API_BASE_URL) {
      api.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
    }

    const auth0 = window.__CONFIG__?.auth0 || {};

    root.render(
      <StrictMode>
        <BrowserRouter>
          <Auth0Provider
            domain={auth0.domain || import.meta.env.VITE_AUTH0_DOMAIN}
            clientId={auth0.clientId || import.meta.env.VITE_AUTH0_CLIENT_ID}
            authorizationParams={{
              redirect_uri: window.location.origin,
              audience: auth0.audience || import.meta.env.VITE_AUTH0_AUDIENCE,
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
  } catch (e) {
    // En caso de falla, render con variables de entorno como fallback
    root.render(
      <StrictMode>
        <BrowserRouter>
          <Auth0Provider
            domain={import.meta.env.VITE_AUTH0_DOMAIN}
            clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
            authorizationParams={{
              redirect_uri: window.location.origin,
              audience: import.meta.env.VITE_AUTH0_AUDIENCE,
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
  }
}

bootstrap();
