import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [me, setMe] = useState<string | null>(null);

  const testApi = async () => {
    const tokenCookie = await chrome.cookies?.get({ url: 'https://creator.co', name: 'idm_token_v1' });
    const token = tokenCookie?.value;

    try {
      const response = await fetch('https://backend.creator.co/me', {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Authorization': `Bearer ${token}`,
          'Origin': 'https://dashboard.creator.co',
          'Referer': 'https://dashboard.creator.co/',
          'x-experimental-feature-flag': 'idm',
        },
        credentials: 'include', // Ensures cookies are sent if needed
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMe(data.email || 'No email found');
      console.log('API response:', data);
    } catch (error) {
      console.error('Error fetching API:', error);
    }
  };

  useEffect(() => {
    // This effect runs once when the component mounts
    console.log('App component mounted');

    if (typeof chrome !== 'undefined' && chrome.cookies) {
      // get cookies by name
      chrome.cookies?.get({ url: 'https://creator.co', name: 'idm_token_v1'}, (cookie) => {
        console.log('idm_token_v1 cookie:', cookie);
      });

      // get value of cookie
      chrome.cookies?.get({ url: 'https://creator.co', name: 'idm_token_v1'}, (cookie) => {
        if (cookie) {
          console.log('idm_token_v1 value:', cookie.value);
          // testApi(cookie.value);
        } else {
          console.log('idm_token_v1 cookie not found');
        }
      });
    }
  }, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Creator.co Search Extension</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        <p>
          <button onClick={testApi}>Set Me</button> 
        </p>
        <div>{me}</div>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
