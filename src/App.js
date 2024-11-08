import React, { useState, useEffect } from 'react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [repositories, setRepositories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const authenticate = async () => {
      try {
        const response = await fetch('/auth');
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setError('Authentication failed');
        }
      } catch (error) {
        setError('Authentication error');
      }
    };

    authenticate();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchRepositories = async () => {
        try {
          const response = await fetch('/repositories');
          const data = await response.json();
          setRepositories(data);
        } catch (error) {
          setError('Error fetching repositories');
        }
      };

      fetchRepositories();
    }
  }, [isAuthenticated]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!isAuthenticated) {
    return <div>Authenticating...</div>;
  }

  return (
    <div>
      <h1>GitHub Repositories</h1>
      <ul>
        {repositories.map((repo) => (
          <li key={repo.id}>{repo.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
