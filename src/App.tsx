import { Actor, HttpAgent } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { useEffect, useState } from 'react';
import './App.css';
import motokoLogo from './assets/motoko_moving.png';
import motokoShadowLogo from './assets/motoko_shadow.png';
import reactLogo from './assets/react.svg';
import * as be from './declarations/backend';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [count, setCount] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [backend, setBackend] = useState<any>(be.backend);

  let principal: string;
  let iiUrl: string;
  
  if (process.env.DFX_NETWORK === "local" || process.env.DFX_NETWORK === undefined) {
    iiUrl =  `http://localhost:4943/?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}`;
  } else if (process.env.DFX_NETWORK === "ic") {
    iiUrl = `https://identity.internetcomputer.org`;
  };

  
  // Get the current counter value
  const fetchCount = async () => {
    try {
      setLoading(true);
      const count = await backend.get();
      setCount(+count.toString()); // Convert BigInt to number
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const notify = () => toast.error("You are not logged in!", {
    position: toast.POSITION.BOTTOM_CENTER
  });

  const increment = async () => {
    if (loading) return; // Cancel if waiting for a new count
    try {
      setLoading(true);
      await backend.inc(); // Increment the count by 1
      await fetchCount(); // Fetch the new count
    } catch (err) {
      notify();
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const authClient = await AuthClient.create();
    authClient.login({
      async onSuccess() {
        // At this point we're authenticated, and we can get the identity from the auth client:
        const identity = await authClient.getIdentity();
        // Using the identity obtained from the auth client, we can create an agent to interact with the IC.
        const agent = new HttpAgent( { identity });
        if (process.env.DFX_NETWORK === "local" || process.env.DFX_NETWORK === undefined) {
          await agent.fetchRootKey();
        };
        const backend = Actor.createActor(be.idlFactory, {
          agent,
          canisterId: be.canisterId,
        });
        setBackend(backend);
        setIsLogged(true);
      },
      onError(error) {
        console.log(error);
      },
      identityProvider: iiUrl,
    });
  };

  const logout = async () => {
    const authClient = await AuthClient.create();
    if (await authClient.isAuthenticated()) {
      await authClient.logout();
      setIsLogged(false);
    }
  };


  // Fetch the count on page load
  useEffect(() => {
    fetchCount();
  }, []);

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a
          href="https://internetcomputer.org/docs/current/developer-docs/build/cdks/motoko-dfinity/motoko/"
          target="_blank"
        >
          <span className="logo-stack">
            <img
              src={motokoShadowLogo}
              className="logo motoko-shadow"
              alt="Motoko logo"
            />
            <img src={motokoLogo} className="logo motoko" alt="Motoko logo" />
          </span>
        </a>
      </div>
      <h1>Authenticated Counter Example</h1>
      <div className="card">
        <button onClick={increment} style={{ opacity: loading ? 0.5 : 1 }}>
          count is {count}
        </button>
        <p>
          Edit <code>backend/Main.mo</code> and save to test HMR
        </p>
        {
          isLogged ? 
          <button onClick={logout} style={{ opacity: loading ? 0.5 : 1 }}>
            Logout
          </button>
          :
          <button onClick={handleLogin} style={{ opacity: loading ? 0.5 : 1 }}>
            Login
          </button>
        }
        <ToastContainer autoClose={2000} />
      </div>
    </div>
  );
}

export default App;
