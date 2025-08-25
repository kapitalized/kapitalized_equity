import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const Home = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get('/api/companies');
        console.log('Companies data:', response.data); // Debug log
        setCompanies(response.data.data || response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching companies:', error);
        setError('Failed to load companies. Check the backend or network.');
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;
  if (!companies.length) return <div className="text-center p-4">No companies found.</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Companies</h1>
      <ul className="list-disc pl-5">
        {companies.map((company) => (
          <li key={company.id} className="my-2">{company.name}</li>
        ))}
      </ul>
    </div>
  );
};

const CompanyDetail = ({ match }) => {
  const [shareholders, setShareholders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShareholders = async () => {
      try {
        const response = await axios.get(`/api/shareholders/${match.params.id}`);
        console.log('Shareholders data:', response.data); // Debug log
        setShareholders(response.data.data || response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching shareholders:', error);
        setError('Failed to load shareholders. Check the backend or network.');
        setLoading(false);
      }
    };
    fetchShareholders();
  }, [match.params.id]);

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;
  if (!shareholders.length) return <div className="text-center p-4">No shareholders found.</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Shareholders</h1>
      <ul className="list-disc pl-5">
        {shareholders.map((shareholder) => (
          <li key={shareholder.id} className="my-2">{shareholder.name} - {shareholder.email}</li>
        ))}
      </ul>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route path="/shareholders/:id" element={<CompanyDetail />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
